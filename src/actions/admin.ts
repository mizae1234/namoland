"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminUsers() {
    return prisma.adminUser.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
}

export async function createAdminUser(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "ADMIN";

    if (!name || !email || !password) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) return { error: "อีเมลนี้มีอยู่ในระบบแล้ว" };

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const hashed = await bcrypt.hash(password, 10);

    await prisma.adminUser.create({
        data: {
            name,
            email,
            password: hashed,
            role: role as "ADMIN" | "SUPER_ADMIN",
        },
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function updateAdminUser(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "ADMIN";

    if (!id || !name || !email) {
        return { error: "ข้อมูลไม่ครบ" };
    }

    // Check email uniqueness
    const existing = await prisma.adminUser.findFirst({
        where: { email, id: { not: id } },
    });
    if (existing) return { error: "อีเมลนี้มีผู้ใช้คนอื่นใช้อยู่แล้ว" };

    const data: Record<string, unknown> = {
        name,
        email,
        role: role as "ADMIN" | "SUPER_ADMIN",
    };

    if (password) {
        const bcryptModule = await import("bcryptjs");
        const bcrypt = bcryptModule.default || bcryptModule;
        data.password = await bcrypt.hash(password, 10);
    }

    await prisma.adminUser.update({
        where: { id },
        data,
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function deleteAdminUser(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    // Prevent self-delete
    if (session.user.id === id) {
        return { error: "ไม่สามารถลบตัวเองได้" };
    }

    // Check count
    const count = await prisma.adminUser.count();
    if (count <= 1) {
        return { error: "ต้องมีผู้ดูแลอย่างน้อย 1 คน" };
    }

    await prisma.adminUser.delete({ where: { id } });

    revalidatePath("/settings");
    return { success: true };
}
