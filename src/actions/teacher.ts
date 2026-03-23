"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getAllTeachers() {
    return prisma.teacher.findMany({
        orderBy: { sortOrder: "asc" },
    });
}

export async function getActiveTeachers() {
    return prisma.teacher.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function createTeacher(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const name = (formData.get("name") as string)?.trim();
    const nickname = (formData.get("nickname") as string)?.trim() || null;
    const color = (formData.get("color") as string)?.trim() || null;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!name) {
        return { error: "กรุณากรอกชื่อครู" };
    }

    await prisma.teacher.create({
        data: { name, nickname, color, sortOrder },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function updateTeacher(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const nickname = (formData.get("nickname") as string)?.trim() || null;
    const color = (formData.get("color") as string)?.trim() || null;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!id || !name) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    await prisma.teacher.update({
        where: { id },
        data: { name, nickname, color, sortOrder },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function toggleTeacherActive(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) return { error: "ไม่พบครู" };

    await prisma.teacher.update({
        where: { id },
        data: { isActive: !teacher.isActive },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function deleteTeacher(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    // Nullify references in ClassEntry first
    await prisma.classEntry.updateMany({
        where: { teacherId: id },
        data: { teacherId: null },
    });

    await prisma.teacher.delete({ where: { id } });

    revalidatePath("/settings");
    return { success: true };
}
