"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
    prepareFIFODeduction,
    buildPackageDeductOps,
    buildTransactionOps,
    syncCoinExpiryOverride,
} from "@/lib/coin-service";

// Search members with children for booking
export async function searchMembersForBooking(query: string) {
    if (!query || query.length < 1) return [];
    const members = await prisma.user.findMany({
        where: {
            OR: [
                { parentName: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { children: { some: { name: { contains: query, mode: "insensitive" } } } },
            ],
        },
        include: {
            children: true,
            coinPackages: {
                where: { isExpired: false, remainingCoins: { gt: 0 } },
                orderBy: { purchaseDate: "asc" },
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
            classEntry: {
                include: { schedule: true }
            },
            user: true,
        },
    });
    if (!booking) return { error: "ไม่พบการจอง" };
    if (booking.status !== "BOOKED") return { error: "สถานะไม่ใช่ BOOKED" };

    // Find activity config to get coin cost
    const activity = await findActivityConfig(booking.classEntry.title);

    if (!activity) {
        return { error: `ไม่พบกิจกรรม "${booking.classEntry.title}" ในระบบ กรุณาตั้งค่ากิจกรรมก่อน` };
    }

    const coinCost = activity.coins;

    // Determine exact class time for backdated accuracy (Timezone-safe for UTC servers)
    const classDate = new Date(booking.classEntry.schedule.startDate.getTime());
    classDate.setUTCHours(classDate.getUTCHours() + 7); // Shift to BKK time
    const dayOffset = booking.classEntry.dayOfWeek; // 0=StartDate, 6=StartDate+6
    classDate.setUTCDate(classDate.getUTCDate() + dayOffset);
    if (booking.classEntry.startTime) {
        const [hours, minutes] = booking.classEntry.startTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            classDate.setUTCHours(hours, minutes, 0, 0);
        }
    }
    classDate.setUTCHours(classDate.getUTCHours() - 7); // Shift back to absolute UTC
    const now = classDate;

    if (coinCost > 0) {
        // FIFO coin deduction (shared service)
        const { deductions, totalAvailable } = await prepareFIFODeduction(booking.userId, coinCost);

        if (totalAvailable < coinCost) {
            return { error: `เหรียญไม่เพียงพอ (ต้องการ ${coinCost}, มี ${totalAvailable})` };
        }

        const txOps = [
            ...buildPackageDeductOps(deductions, now),
            ...buildTransactionOps(deductions, "CLASS_FEE", session.user.id, {
                className: booking.classEntry.title,
                description: `Check-in: ${booking.classEntry.title} (${booking.classEntry.startTime}-${booking.classEntry.endTime})`,
                createdAt: now,
            }),
            prisma.classBooking.update({
                where: { id: bookingId },
                data: {
                    status: "CHECKED_IN",
                    coinsCharged: coinCost,
                    checkedInAt: now,
                },
            }),
        ];

        await prisma.$transaction(txOps);

        // Sync expiry override (shared service)
        await syncCoinExpiryOverride(booking.userId, deductions, now);
    } else {
        // Free activity — just mark checked in
        await prisma.classBooking.update({
            where: { id: bookingId },
            data: {
                status: "CHECKED_IN",
                coinsCharged: 0,
                checkedInAt: now,
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

// ─── Helper: Activity Config Lookup ──────────────────────────────────

/**
 * Find activity config by class title.
 * Tries: exact match → contains → reverse-contains.
 */
async function findActivityConfig(classTitle: string) {
    // Exact match
    let activity = await prisma.activityConfig.findFirst({
        where: { name: classTitle },
    });
    if (activity) return activity;

    // Activity name contains class title
    activity = await prisma.activityConfig.findFirst({
        where: { name: { contains: classTitle, mode: "insensitive" } },
    });
    if (activity) return activity;

    // Class title contains activity name
    const allActivities = await prisma.activityConfig.findMany();
    return allActivities.find(
        (a) => classTitle.toLowerCase().includes(a.name.toLowerCase())
    ) || null;
}
