"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createMember(formData: FormData) {
    const parentName = formData.get("parentName") as string;
    const phone = formData.get("phone") as string;
    const childrenJson = formData.get("children") as string;

    if (!parentName || !phone) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
        return { error: "เบอร์โทรศัพท์นี้ถูกใช้แล้ว" };
    }

    const qrCode = `NML-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // Default password = last 4 digits of phone (digits only)
    const digits = phone.replace(/\D/g, "");
    const defaultPassword = digits.slice(-4);
    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const children = childrenJson ? JSON.parse(childrenJson) : [];

    await prisma.user.create({
        data: {
            parentName,
            phone,
            password: hashedPassword,
            qrCode,
            children: {
                create: children.map((c: { name: string; birthDate: string }) => ({
                    name: c.name,
                    birthDate: new Date(c.birthDate),
                })),
            },
        },
    });

    revalidatePath("/members");
    return { success: true };
}

export async function getMembers(search?: string) {
    return prisma.user.findMany({
        where: search
            ? {
                OR: [
                    { parentName: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search } },
                ],
            }
            : undefined,
        include: {
            children: true,
            coinPackages: {
                where: { isExpired: false, remainingCoins: { gt: 0 } },
            },
            _count: { select: { borrowRecords: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getMemberById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            children: true,
            coinPackages: {
                include: { transactions: { orderBy: { createdAt: "desc" } } },
                orderBy: { createdAt: "desc" },
            },
            borrowRecords: {
                include: { items: { include: { book: true } } },
                orderBy: { createdAt: "desc" },
            },
            expiryLogs: {
                orderBy: { createdAt: "desc" },
            },
        },
    });
}

export async function getMemberByQrCode(qrCode: string) {
    return prisma.user.findUnique({
        where: { qrCode },
        include: {
            children: true,
            coinPackages: {
                where: { isExpired: false, remainingCoins: { gt: 0 } },
                orderBy: { createdAt: "desc" },
            },
            borrowRecords: {
                where: { status: "BORROWED" },
                include: { items: { include: { book: true } } },
            },
        },
    });
}

export async function updateMember(formData: FormData) {
    const id = formData.get("id") as string;
    const parentName = formData.get("parentName") as string;
    const phone = formData.get("phone") as string;
    const childrenJson = formData.get("children") as string;

    if (!id || !parentName || !phone) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    // Check phone uniqueness
    const existing = await prisma.user.findFirst({
        where: { phone, id: { not: id } },
    });
    if (existing) return { error: "เบอร์โทรศัพท์นี้มีคนอื่นใช้อยู่แล้ว" };

    // Parse children
    const newChildren: { id?: string; name: string; birthDate: string }[] = childrenJson
        ? JSON.parse(childrenJson)
        : [];

    // Get current children
    const currentChildren = await prisma.child.findMany({ where: { userId: id } });
    const currentIds = currentChildren.map(c => c.id);
    const newIds = newChildren.filter(c => c.id).map(c => c.id!);

    // Delete removed children
    const toDelete = currentIds.filter(cid => !newIds.includes(cid));

    await prisma.$transaction([
        // Update user
        prisma.user.update({
            where: { id },
            data: { parentName, phone },
        }),
        // Delete removed children
        ...(toDelete.length > 0
            ? [prisma.child.deleteMany({ where: { id: { in: toDelete } } })]
            : []),
        // Update existing children
        ...newChildren
            .filter(c => c.id)
            .map(c =>
                prisma.child.update({
                    where: { id: c.id! },
                    data: { name: c.name, birthDate: new Date(c.birthDate) },
                })
            ),
        // Create new children
        ...newChildren
            .filter(c => !c.id)
            .map(c =>
                prisma.child.create({
                    data: {
                        userId: id,
                        name: c.name,
                        birthDate: new Date(c.birthDate),
                    },
                })
            ),
    ]);

    revalidatePath(`/members/${id}`);
    revalidatePath("/members");
    return { success: true };
}

export async function resetMemberPassword(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: { phone: true } });
    if (!user) return { error: "ไม่พบสมาชิก" };

    const digits = user.phone.replace(/\D/g, "");
    const defaultPassword = digits.slice(-4);

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const hashed = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
        where: { id },
        data: { password: hashed },
    });

    revalidatePath(`/members/${id}`);
    return { success: true, hint: defaultPassword };
}

// ============= USER SELF-EDIT =============

import { auth } from "@/lib/auth";

export async function updateSelfProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") return { error: "Unauthorized" };

    const userId = session.user.id;
    const parentName = formData.get("parentName") as string;
    const phone = formData.get("phone") as string;
    const childrenJson = formData.get("children") as string;

    if (!parentName || !phone) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    // Check phone uniqueness
    const existing = await prisma.user.findFirst({
        where: { phone, id: { not: userId } },
    });
    if (existing) return { error: "เบอร์โทรศัพท์นี้มีคนอื่นใช้อยู่แล้ว" };

    const newChildren: { id?: string; name: string; birthDate: string }[] = childrenJson
        ? JSON.parse(childrenJson)
        : [];

    const currentChildren = await prisma.child.findMany({ where: { userId } });
    const currentIds = currentChildren.map(c => c.id);
    const newIds = newChildren.filter(c => c.id).map(c => c.id!);
    const toDelete = currentIds.filter(cid => !newIds.includes(cid));

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { parentName, phone },
        }),
        ...(toDelete.length > 0
            ? [prisma.child.deleteMany({ where: { id: { in: toDelete } } })]
            : []),
        ...newChildren
            .filter(c => c.id)
            .map(c =>
                prisma.child.update({
                    where: { id: c.id! },
                    data: { name: c.name, birthDate: new Date(c.birthDate) },
                })
            ),
        ...newChildren
            .filter(c => !c.id)
            .map(c =>
                prisma.child.create({
                    data: { userId, name: c.name, birthDate: new Date(c.birthDate) },
                })
            ),
    ]);

    revalidatePath("/user/profile");
    revalidatePath("/user");
    return { success: true };
}

export async function changeSelfPassword(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") return { error: "Unauthorized" };

    const userId = session.user.id;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword) return { error: "กรุณากรอกรหัสผ่านให้ครบ" };
    if (newPassword.length < 4) return { error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัว" };

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user?.password) return { error: "ไม่พบข้อมูล" };

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return { error: "รหัสผ่านเดิมไม่ถูกต้อง" };

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { success: true };
}
