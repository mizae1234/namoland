"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getShopInfo() {
    let shop = await prisma.shopInfo.findFirst();
    if (!shop) {
        shop = await prisma.shopInfo.create({
            data: { shopName: "NAMOLAND" },
        });
    }
    return shop;
}

export async function updateShopInfo(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const shopName = formData.get("shopName") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;
    const note = formData.get("note") as string;

    let shop = await prisma.shopInfo.findFirst();
    if (!shop) {
        shop = await prisma.shopInfo.create({
            data: { shopName: shopName || "NAMOLAND" },
        });
    }

    await prisma.shopInfo.update({
        where: { id: shop.id },
        data: {
            shopName: shopName || "NAMOLAND",
            bankName: bankName || null,
            accountNumber: accountNumber || null,
            accountName: accountName || null,
            note: note || null,
        },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function updateScheduleImage(url: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    let shop = await prisma.shopInfo.findFirst();
    if (!shop) {
        shop = await prisma.shopInfo.create({
            data: { shopName: "NAMOLAND" },
        });
    }

    await prisma.shopInfo.update({
        where: { id: shop.id },
        data: { scheduleImageUrl: url },
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
}

export async function removeScheduleImage() {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    let shop = await prisma.shopInfo.findFirst();
    if (!shop) return { success: true };

    await prisma.shopInfo.update({
        where: { id: shop.id },
        data: { scheduleImageUrl: null },
    });

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
}
