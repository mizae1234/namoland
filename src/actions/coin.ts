"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

const PACKAGE_TABLE: Record<string, { coins: number; price: number; bonus: number }> = {
    "5_COINS": { coins: 5, price: 1000, bonus: 0 },
    "10_COINS": { coins: 10, price: 1900, bonus: 100 },
    "20_COINS": { coins: 20, price: 3700, bonus: 300 },
    "30_COINS": { coins: 30, price: 5400, bonus: 600 },
};

export async function purchasePackage(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const userId = formData.get("userId") as string;
    const packageType = formData.get("packageType") as string;
    const customCoins = formData.get("customCoins") as string;
    const customPrice = formData.get("customPrice") as string;

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
        const pkg = PACKAGE_TABLE[packageType];
        if (!pkg) return { error: "แพ็คเกจไม่ถูกต้อง" };
        coins = pkg.coins;
        price = pkg.price;
        bonus = pkg.bonus;
    }

    await prisma.coinPackage.create({
        data: {
            userId,
            packageType,
            totalCoins: coins,
            remainingCoins: coins,
            pricePaid: price,
            bonusAmount: bonus,
        },
    });

    revalidatePath("/members");
    revalidatePath("/coins");
    return { success: true };
}

export async function useCoins(formData: FormData) {
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

    // Start coin expiry clock on first use
    const updateData: Record<string, unknown> = {
        remainingCoins: pkg.remainingCoins - coinsUsed,
    };

    if (!pkg.firstUsedAt) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        updateData.firstUsedAt = now;
        updateData.expiresAt = expiresAt;
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

export async function confirmExpiry(packageId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return { error: "ไม่พบแพ็คเกจ" };

    await prisma.$transaction([
        prisma.coinPackage.update({
            where: { id: packageId },
            data: { isExpired: true, remainingCoins: 0 },
        }),
        prisma.coinTransaction.create({
            data: {
                packageId,
                type: "EXPIRED",
                coinsUsed: pkg.remainingCoins,
                description: "เหรียญหมดอายุ",
                processedById: session.user.id,
            },
        }),
    ]);

    revalidatePath("/coins");
    return { success: true };
}

export async function extendExpiry(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const packageId = formData.get("packageId") as string;
    const days = parseInt(formData.get("days") as string);
    const note = formData.get("note") as string;

    if (!packageId || isNaN(days) || days <= 0) {
        return { error: "ข้อมูลไม่ถูกต้อง" };
    }

    const pkg = await prisma.coinPackage.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.expiresAt) return { error: "ไม่พบแพ็คเกจ" };

    const newExpiry = new Date(pkg.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + days);

    await prisma.coinPackage.update({
        where: { id: packageId },
        data: {
            expiresAt: newExpiry,
            isExtended: true,
            extendedAt: new Date(),
            extendedBy: session.user.id,
            note: note || null,
            isExpired: false,
        },
    });

    revalidatePath("/coins");
    return { success: true };
}
