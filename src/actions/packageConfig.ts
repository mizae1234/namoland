"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getActivePackages() {
    return prisma.packageConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getAllPackageConfigs() {
    return prisma.packageConfig.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function getPackageByKey(key: string) {
    return prisma.packageConfig.findUnique({ where: { key } });
}

export async function createPackageConfig(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const label = (formData.get("label") as string)?.trim();
    const coins = parseInt(formData.get("coins") as string);
    const price = parseInt(formData.get("price") as string);
    const bonus = parseInt(formData.get("bonus") as string) || 0;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!label || isNaN(coins) || isNaN(price)) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    // Auto-generate key from coins count
    let key = `PKG_${coins}`;
    const existing = await prisma.packageConfig.findUnique({ where: { key } });
    if (existing) {
        // Add suffix if duplicate
        const count = await prisma.packageConfig.count({ where: { key: { startsWith: `PKG_${coins}` } } });
        key = `PKG_${coins}_${count + 1}`;
    }

    await prisma.packageConfig.create({
        data: { key, label, coins, price, bonus, sortOrder },
    });

    revalidatePath("/coins/packages");
    return { success: true };
}

export async function updatePackageConfig(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const label = (formData.get("label") as string)?.trim();
    const coins = parseInt(formData.get("coins") as string);
    const price = parseInt(formData.get("price") as string);
    const bonus = parseInt(formData.get("bonus") as string) || 0;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!id || !label || isNaN(coins) || isNaN(price)) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    await prisma.packageConfig.update({
        where: { id },
        data: { label, coins, price, bonus, sortOrder },
    });

    revalidatePath("/coins/packages");
    revalidatePath("/members");
    revalidatePath("/user/coins");
    return { success: true };
}

export async function togglePackageActive(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const pkg = await prisma.packageConfig.findUnique({ where: { id } });
    if (!pkg) return { error: "ไม่พบแพ็คเกจ" };

    await prisma.packageConfig.update({
        where: { id },
        data: { isActive: !pkg.isActive },
    });

    revalidatePath("/coins/packages");
    return { success: true };
}

export async function deletePackageConfig(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    await prisma.packageConfig.delete({ where: { id } });

    revalidatePath("/coins/packages");
    return { success: true };
}

export async function seedPackageConfigs() {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const count = await prisma.packageConfig.count();
    if (count > 0) return { error: "มีข้อมูลแพ็คเกจอยู่แล้ว" };

    const defaults = [
        { key: "5_COINS", label: "5 เหรียญ", coins: 5, price: 1000, bonus: 0, sortOrder: 1 },
        { key: "10_COINS", label: "10 เหรียญ", coins: 10, price: 1900, bonus: 100, sortOrder: 2 },
        { key: "20_COINS", label: "20 เหรียญ", coins: 20, price: 3700, bonus: 300, sortOrder: 3 },
        { key: "30_COINS", label: "30 เหรียญ", coins: 30, price: 5400, bonus: 600, sortOrder: 4 },
    ];

    await prisma.packageConfig.createMany({ data: defaults });

    revalidatePath("/coins/packages");
    return { success: true };
}
