"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPackageByKey } from "@/actions/packageConfig";
import {
    prepareFIFODeduction,
    buildPackageDeductOps,
    buildTransactionOps,
    syncCoinExpiryOverride,
} from "@/lib/coin-service";

export async function purchasePackage(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const userId = formData.get("userId") as string;
    const packageType = formData.get("packageType") as string;
    const customCoins = formData.get("customCoins") as string;
    const customPrice = formData.get("customPrice") as string;
    const note = (formData.get("note") as string) || null;
    const paymentMethod = (formData.get("paymentMethod") as string) || null;

    let coins: number;
    let price: number;
    let bonus = 0;

    if (packageType === "CUSTOM") {
        coins = parseInt(customCoins);
        price = parseInt(customPrice);
        if (isNaN(coins) || isNaN(price)) {
            return { error: "กรุณากรอกจำนวนเหรียญและราคาให้ถูกต้อง" };
        }
    } else {
        const pkgConfig = await getPackageByKey(packageType);
        if (!pkgConfig) return { error: "แพ็คเกจไม่ถูกต้อง" };
        coins = pkgConfig.coins;
        price = pkgConfig.price;
        bonus = pkgConfig.bonus;
    }

    await prisma.coinPackage.create({
        data: {
            userId,
            packageType,
            totalCoins: coins,
            remainingCoins: coins,
            pricePaid: price,
            bonusAmount: bonus,
            note,
            paymentMethod,
        },
    });

    revalidatePath("/members");
    revalidatePath("/coins");
    return { success: true };
}

export async function spendCoins(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const packageId = formData.get("packageId") as string;
    const coinsUsed = parseInt(formData.get("coinsUsed") as string);
    const className = formData.get("className") as string;
    const classHours = formData.get("classHours") as string;
    const description = formData.get("description") as string;

    if (!packageId || isNaN(coinsUsed) || coinsUsed <= 0) {
        return { error: "ข้อมูลไม่ถูกต้อง" };
    }

    const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return { error: "ไม่พบแพ็คเกจเหรียญ" };
    if (pkg.remainingCoins < coinsUsed) return { error: "เหรียญไม่เพียงพอ" };

    const now = new Date();

    // Build update data — start expiry clock on first use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
        remainingCoins: pkg.remainingCoins - coinsUsed,
    };

    let newExpiresAt: Date | null = null;
    if (!pkg.firstUsedAt) {
        newExpiresAt = new Date(now);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
        updateData.firstUsedAt = now;
        updateData.expiresAt = newExpiresAt;
    }

    await prisma.$transaction([
        prisma.coinPackage.update({
            where: { id: packageId },
            data: updateData,
        }),
        prisma.coinTransaction.create({
            data: {
                packageId,
                type: "CLASS_FEE",
                coinsUsed,
                className: className || null,
                classHours: classHours ? parseFloat(classHours) : null,
                description: description || null,
                processedById: session.user.id,
            },
        }),
    ]);

    // Sync expiry override if clock just started
    if (newExpiresAt) {
        await syncCoinExpiryOverride(
            pkg.userId,
            [{ packageId: pkg.id, amount: coinsUsed, pkg: { ...pkg, firstUsedAt: null } as never }],
            now,
        );
    }

    revalidatePath("/members");
    revalidatePath("/coins");
    return { success: true };
}

export async function getExpiringPackages() {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return prisma.coinPackage.findMany({
        where: {
            isExpired: false,
            remainingCoins: { gt: 0 },
            expiresAt: {
                not: null,
                lte: sevenDaysFromNow,
            },
        },
        include: { user: true },
        orderBy: { expiresAt: "asc" },
    });
}

export async function extendExpiry(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

        const userId = formData.get("userId") as string;
        const targetDateStr = formData.get("targetDate") as string;
        const note = formData.get("note") as string;

        if (!userId || !targetDateStr) {
            return { error: "ข้อมูลไม่ถูกต้อง" };
        }

        const targetDate = new Date(targetDateStr);
        targetDate.setHours(23, 59, 59, 999);

        if (isNaN(targetDate.getTime())) {
            return { error: "วันที่ไม่ถูกต้อง" };
        }

        // Get current override for history
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { coinExpiryOverride: true },
        });

        // Update member-level override + create history log
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { coinExpiryOverride: targetDate },
            }),
            prisma.expiryLog.create({
                data: {
                    userId,
                    previousDate: currentUser?.coinExpiryOverride || null,
                    newDate: targetDate,
                    note: note || null,
                    performedBy: session.user.id,
                },
            }),
        ]);

        revalidatePath("/coins");
        revalidatePath("/members");
        return { success: true };
    } catch (err) {
        console.error("extendExpiry error:", err);
        return { error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "Unknown"}` };
    }
}

// ===== Deduct / Adjust Coins =====

export async function deductCoins(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

        const userId = formData.get("userId") as string;
        const coinsToDeduct = parseInt(formData.get("coinsToDeduct") as string);
        const reason = (formData.get("reason") as string) || "ปรับลดเหรียญ";

        if (!userId || isNaN(coinsToDeduct) || coinsToDeduct <= 0) {
            return { error: "ข้อมูลไม่ถูกต้อง" };
        }

        // Use shared FIFO deduction
        const { deductions, totalAvailable } = await prepareFIFODeduction(userId, coinsToDeduct);

        if (totalAvailable < coinsToDeduct) {
            return { error: `เหรียญไม่เพียงพอ (คงเหลือ ${totalAvailable} เหรียญ)` };
        }

        const now = new Date();
        const ops = [
            ...buildPackageDeductOps(deductions, now),
            ...deductions.map((d) =>
                prisma.coinTransaction.create({
                    data: {
                        packageId: d.packageId,
                        type: "ADJUSTMENT",
                        coinsUsed: d.amount,
                        description: reason,
                        processedById: session.user.id,
                    },
                }),
            ),
        ];

        await prisma.$transaction(ops);

        revalidatePath("/members");
        revalidatePath("/coins");
        return { success: true };
    } catch (err) {
        console.error("deductCoins error:", err);
        return { error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "Unknown"}` };
    }
}

export async function adjustCoinsUp(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

        const userId = formData.get("userId") as string;
        const coinsToAdd = parseInt(formData.get("coinsToAdd") as string);
        const reason = (formData.get("reason") as string) || "ปรับเพิ่มเหรียญ";

        if (!userId || isNaN(coinsToAdd) || coinsToAdd <= 0) {
            return { error: "ข้อมูลไม่ถูกต้อง" };
        }

        // Add to the oldest active package, or create a new adjustment package
        const activePackage = await prisma.coinPackage.findFirst({
            where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
            orderBy: { createdAt: "asc" },
        });

        if (activePackage) {
            await prisma.$transaction([
                prisma.coinPackage.update({
                    where: { id: activePackage.id },
                    data: {
                        remainingCoins: { increment: coinsToAdd },
                        totalCoins: { increment: coinsToAdd },
                    },
                }),
                prisma.coinTransaction.create({
                    data: {
                        packageId: activePackage.id,
                        type: "ADJUSTMENT",
                        coinsUsed: -coinsToAdd, // negative = added
                        description: `[เพิ่ม] ${reason}`,
                        processedById: session.user.id,
                    },
                }),
            ]);
        } else {
            // No active package — create a new one
            const newPkg = await prisma.coinPackage.create({
                data: {
                    userId,
                    packageType: "ADJUSTMENT",
                    totalCoins: coinsToAdd,
                    remainingCoins: coinsToAdd,
                    pricePaid: 0,
                },
            });
            await prisma.coinTransaction.create({
                data: {
                    packageId: newPkg.id,
                    type: "ADJUSTMENT",
                    coinsUsed: -coinsToAdd,
                    description: `[เพิ่ม] ${reason}`,
                    processedById: session.user.id,
                },
            });
        }

        revalidatePath("/members");
        revalidatePath("/coins");
        return { success: true };
    } catch (err) {
        console.error("adjustCoinsUp error:", err);
        return { error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "Unknown"}` };
    }
}

// ===== Top-Up Request Actions =====

export async function createTopUpRequest(packageType: string, slipNote?: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") {
        return { error: "Unauthorized" };
    }

    const pkgConfig = await getPackageByKey(packageType);
    if (!pkgConfig) return { error: "แพ็คเกจไม่ถูกต้อง" };

    // Check if user already has a pending request
    const pending = await prisma.topUpRequest.findFirst({
        where: { userId: session.user.id, status: "PENDING" },
    });
    if (pending) {
        return { error: "คุณมีคำขอเติมเหรียญที่รอดำเนินการอยู่แล้ว กรุณารอ admin ตรวจสอบ" };
    }

    await prisma.topUpRequest.create({
        data: {
            userId: session.user.id,
            packageType,
            coins: pkgConfig.coins,
            amount: pkgConfig.price,
            slipNote: slipNote || null,
        },
    });

    revalidatePath("/user/coins");
    return { success: true };
}

export async function getUserTopUpRequests() {
    const session = await auth();
    if (!session?.user) return [];

    return prisma.topUpRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
}

export async function getPendingTopUps() {
    return prisma.topUpRequest.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
    });
}

export async function getAllTopUps() {
    return prisma.topUpRequest.findMany({
        include: { user: { select: { parentName: true, phone: true } } },
        orderBy: { createdAt: "desc" },
    });
}

export async function getTopUpsByUser(userId: string) {
    return prisma.topUpRequest.findMany({
        where: { userId },
        include: {
            user: { select: { parentName: true, phone: true } },
            processedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function processTopUp(requestId: string, action: "APPROVED" | "REJECTED", adminNote?: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const request = await prisma.topUpRequest.findUnique({
        where: { id: requestId },
    });
    if (!request) return { error: "ไม่พบคำขอ" };
    if (request.status !== "PENDING") return { error: "คำขอนี้ถูกดำเนินการแล้ว" };

    if (action === "APPROVED") {
        const pkgConfig = await getPackageByKey(request.packageType);
        const coins = pkgConfig ? pkgConfig.coins : request.coins;
        const bonus = pkgConfig ? pkgConfig.bonus : 0;

        await prisma.$transaction([
            prisma.topUpRequest.update({
                where: { id: requestId },
                data: {
                    status: "APPROVED",
                    adminNote: adminNote || null,
                    processedById: session.user.id,
                    processedAt: new Date(),
                },
            }),
            prisma.coinPackage.create({
                data: {
                    userId: request.userId,
                    packageType: request.packageType,
                    totalCoins: coins,
                    remainingCoins: coins,
                    pricePaid: request.amount,
                    bonusAmount: bonus,
                },
            }),
        ]);
    } else {
        await prisma.topUpRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                adminNote: adminNote || null,
                processedById: session.user.id,
                processedAt: new Date(),
            },
        });
    }

    revalidatePath("/coins");
    revalidatePath("/coins/top-ups");
    revalidatePath("/members");
    revalidatePath("/user/coins");
    return { success: true };
}
