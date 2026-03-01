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
