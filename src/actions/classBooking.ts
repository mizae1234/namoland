"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

// Search members with children for booking
export async function searchMembersForBooking(query: string) {
    if (!query || query.length < 1) return [];
    const members = await prisma.user.findMany({
        where: {
            OR: [
                { parentName: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
            ],
        },
        include: {
            children: true,
            coinPackages: {
                where: { isExpired: false, remainingCoins: { gt: 0 } },
                orderBy: { createdAt: "asc" },
            },
        },
        take: 10,
        orderBy: { parentName: "asc" },
    });
    return members.map((m) => ({
        id: m.id,
        parentName: m.parentName,
        phone: m.phone,
        children: m.children.map((c) => ({
            id: c.id,
            name: c.name,
        })),
        packages: m.coinPackages.map((p) => ({
            id: p.id,
            packageType: p.packageType,
            remainingCoins: p.remainingCoins,
        })),
        totalCoins: m.coinPackages.reduce((s, p) => s + p.remainingCoins, 0),
    }));
}

// Book a class for a member (no coin deduction)
export async function bookClassForMember(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const classEntryId = formData.get("classEntryId") as string;
    const userId = formData.get("userId") as string;
    const childId = (formData.get("childId") as string) || null;
    const note = (formData.get("note") as string) || null;

    if (!classEntryId || !userId) {
        return { error: "กรุณาเลือกคลาสและสมาชิก" };
    }

    if (!childId) {
        return { error: "กรุณาเลือกบุตรที่จะเข้าเรียน" };
    }

    // Note: ไม่เช็คเหรียญตอนจอง เพราะยังไม่ตัดเหรียญ (ตัดตอน check-in เท่านั้น)

    // Check for duplicate booking
    const existing = await prisma.classBooking.findFirst({
        where: {
            classEntryId,
            userId,
            childId: childId || undefined,
            status: "BOOKED",
        },
    });
    if (existing) return { error: "สมาชิกนี้จองคลาสนี้ไปแล้ว" };

    await prisma.classBooking.create({
        data: {
            classEntryId,
            userId,
            childId,
            note,
            bookedById: session.user.id,
            status: "BOOKED",
        },
    });

    revalidatePath("/classes");
    return { success: true };
}

// Check-in: member arrived → auto FIFO coin deduction (oldest package first)
export async function checkInBooking(bookingId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const booking = await prisma.classBooking.findUnique({
        where: { id: bookingId },
        include: {
            classEntry: true,
            user: true,
        },
    });
    if (!booking) return { error: "ไม่พบการจอง" };
    if (booking.status !== "BOOKED") return { error: "สถานะไม่ใช่ BOOKED" };

    // Find activity config to get coin cost — try multiple matching strategies
    let activity = await prisma.activityConfig.findFirst({
        where: { name: booking.classEntry.title },
    });
    if (!activity) {
        // Try: activity name contains class title
        activity = await prisma.activityConfig.findFirst({
            where: { name: { contains: booking.classEntry.title, mode: "insensitive" } },
        });
    }
    if (!activity) {
        // Try: class title contains activity name
        const allActivities = await prisma.activityConfig.findMany();
        activity = allActivities.find(
            (a) => booking.classEntry.title.toLowerCase().includes(a.name.toLowerCase())
        ) || null;
    }

    // If no activity config found, block check-in — admin must set up activity first
    if (!activity) {
        return { error: `ไม่พบกิจกรรม "${booking.classEntry.title}" ในระบบ กรุณาตั้งค่ากิจกรรมก่อน` };
    }

    const coinCost = activity.coins;

    // Check coin balance for paid activities
    if (coinCost > 0) {
        // FIFO: get oldest non-expired package with coins
        const packages = await prisma.coinPackage.findMany({
            where: {
                userId: booking.userId,
                isExpired: false,
                remainingCoins: { gt: 0 },
            },
            orderBy: { createdAt: "asc" },
        });

        const totalAvailable = packages.reduce((s, p) => s + p.remainingCoins, 0);
        if (totalAvailable < coinCost) {
            return { error: `เหรียญไม่เพียงพอ (ต้องการ ${coinCost}, มี ${totalAvailable})` };
        }

        // Deduct from oldest package first (FIFO)
        let remaining = coinCost;
        const txOps = [];
        for (const pkg of packages) {
            if (remaining <= 0) break;
            const deduct = Math.min(remaining, pkg.remainingCoins);
            remaining -= deduct;

            const updateData: Record<string, unknown> = {
                remainingCoins: pkg.remainingCoins - deduct,
            };

            // Start expiry clock on first use
            if (!pkg.firstUsedAt) {
                const now = new Date();
                const expiresAt = new Date(now);
                expiresAt.setMonth(expiresAt.getMonth() + 1);
                updateData.firstUsedAt = now;
                updateData.expiresAt = expiresAt;
            }

            txOps.push(
                prisma.coinPackage.update({
                    where: { id: pkg.id },
                    data: updateData,
                })
            );
            txOps.push(
                prisma.coinTransaction.create({
                    data: {
                        packageId: pkg.id,
                        type: "CLASS_FEE",
                        coinsUsed: deduct,
                        className: booking.classEntry.title,
                        description: `Check-in: ${booking.classEntry.title} (${booking.classEntry.startTime}-${booking.classEntry.endTime})`,
                        processedById: session.user.id,
                    },
                })
            );
        }

        txOps.push(
            prisma.classBooking.update({
                where: { id: bookingId },
                data: {
                    status: "CHECKED_IN",
                    coinsCharged: coinCost,
                    checkedInAt: new Date(),
                },
            })
        );

        await prisma.$transaction(txOps);

        // Auto-update coinExpiryOverride
        const firstPkg = packages[0];
        if (firstPkg && !firstPkg.firstUsedAt) {
            const now = new Date();
            const newExpiresAt = new Date(now);
            newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
            const user = await prisma.user.findUnique({
                where: { id: booking.userId },
                select: { coinExpiryOverride: true },
            });
            if (!user?.coinExpiryOverride || newExpiresAt > new Date(user.coinExpiryOverride)) {
                await prisma.user.update({
                    where: { id: booking.userId },
                    data: { coinExpiryOverride: newExpiresAt },
                });
            }
        }
    } else {
        // Free activity — just mark checked in
        await prisma.classBooking.update({
            where: { id: bookingId },
            data: {
                status: "CHECKED_IN",
                coinsCharged: 0,
                checkedInAt: new Date(),
            },
        });
    }

    revalidatePath("/classes");
    revalidatePath("/members");
    revalidatePath("/coins");
    return { success: true, coinsCharged: coinCost };
}

// Cancel booking (no coin refund needed since not deducted yet)
export async function cancelBooking(bookingId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const booking = await prisma.classBooking.findUnique({
        where: { id: bookingId },
    });
    if (!booking) return { error: "ไม่พบการจอง" };
    if (booking.status !== "BOOKED") return { error: "ยกเลิกได้เฉพาะสถานะ BOOKED" };

    await prisma.classBooking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/classes");
    return { success: true };
}

// Mark no-show
export async function markNoShow(bookingId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const booking = await prisma.classBooking.findUnique({
        where: { id: bookingId },
    });
    if (!booking) return { error: "ไม่พบการจอง" };
    if (booking.status !== "BOOKED") return { error: "ทำได้เฉพาะสถานะ BOOKED" };

    await prisma.classBooking.update({
        where: { id: bookingId },
        data: { status: "NO_SHOW" },
    });

    revalidatePath("/classes");
    return { success: true };
}

// Get bookings for a class entry
export async function getBookingsByEntry(entryId: string) {
    return prisma.classBooking.findMany({
        where: { classEntryId: entryId },
        include: {
            user: { select: { id: true, parentName: true, phone: true } },
            child: { select: { id: true, name: true } },
            bookedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
    });
}

// Get bookings for a user (user portal history)
export async function getBookingsForUser(userId: string) {
    return prisma.classBooking.findMany({
        where: { userId },
        include: {
            classEntry: {
                include: {
                    schedule: { select: { startDate: true, endDate: true, theme: true } },
                },
            },
            child: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}

