"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

function revalidateAll() {
    revalidatePath("/activities");
    revalidatePath("/");
}

export async function getActiveActivities() {
    return prisma.activityConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getActivitiesForLanding() {
    return prisma.activityConfig.findMany({
        where: { isActive: true, showOnLanding: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getAllActivityConfigs() {
    return prisma.activityConfig.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function createActivityConfig(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const icon = (formData.get("icon") as string)?.trim() || null;
    const coins = parseInt(formData.get("coins") as string);
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const showOnLanding = formData.get("showOnLanding") !== "false";

    if (!name || isNaN(coins) || coins < 0) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    await prisma.activityConfig.create({
        data: { name, description, icon, coins, sortOrder, showOnLanding },
    });

    revalidateAll();
    return { success: true };
}

export async function updateActivityConfig(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const icon = (formData.get("icon") as string)?.trim() || null;
    const coins = parseInt(formData.get("coins") as string);
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!id || !name || isNaN(coins) || coins < 0) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    await prisma.activityConfig.update({
        where: { id },
        data: { name, description, icon, coins, sortOrder },
    });

    revalidateAll();
    return { success: true };
}

export async function toggleActivityActive(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const activity = await prisma.activityConfig.findUnique({ where: { id } });
    if (!activity) return { error: "ไม่พบกิจกรรม" };

    await prisma.activityConfig.update({
        where: { id },
        data: { isActive: !activity.isActive },
    });

    revalidateAll();
    return { success: true };
}

export async function toggleShowOnLanding(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const activity = await prisma.activityConfig.findUnique({ where: { id } });
    if (!activity) return { error: "ไม่พบกิจกรรม" };

    await prisma.activityConfig.update({
        where: { id },
        data: { showOnLanding: !activity.showOnLanding },
    });

    revalidateAll();
    return { success: true };
}

export async function updateActivityIcon(id: string, iconImageUrl: string | null) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    await prisma.activityConfig.update({
        where: { id },
        data: { iconImageUrl },
    });

    revalidateAll();
    return { success: true };
}

export async function deleteActivityConfig(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    await prisma.activityConfig.delete({ where: { id } });

    revalidateAll();
    return { success: true };
}

export async function seedActivityConfigs() {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const count = await prisma.activityConfig.count();
    if (count > 0) return { error: "มีข้อมูลกิจกรรมอยู่แล้ว" };

    const defaults = [
        { name: "Free Play (1 ชม.)", coins: 1, sortOrder: 1 },
        { name: "Little Explorers (1.5 ชม.)", coins: 1, sortOrder: 2 },
        { name: "Private Grow to Glow (2 ชม.)", coins: 3, sortOrder: 3 },
        { name: "Jolly Designer (2 ชม.)", coins: 5, sortOrder: 4 },
        { name: "Summer Camp – Full day", coins: 6, sortOrder: 5 },
        { name: "Little Artist", coins: 13, sortOrder: 6 },
        { name: "Summer/Camp – Half day", coins: 6, sortOrder: 7 },
        { name: "Inspire Hour – Fashion/Product Design", coins: 1, sortOrder: 8 },
        { name: "Sensory Play", coins: 1, sortOrder: 9 },
        { name: "Book Rental", coins: 1, sortOrder: 10 },
        { name: "รายการอื่นๆ...", coins: 0, sortOrder: 99 },
    ];

    await prisma.activityConfig.createMany({ data: defaults });

    revalidateAll();
    return { success: true };
}
