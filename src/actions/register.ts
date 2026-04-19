"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function registerUser(formData: FormData) {
    const parentName = formData.get("parentName") as string;
    let phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const childrenJson = formData.get("children") as string;

    if (!parentName || !phone || !password) {
        return { error: "กรุณากรอกชื่อ เบอร์โทร และรหัสผ่าน" };
    }

    phone = phone.replace(/\D/g, "");

    if (password.length < 4) {
        return { error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" };
    }

    // Check if phone already exists
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
        return { error: "เบอร์โทรนี้ถูกใช้งานแล้ว" };
    }

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default || bcryptModule;
    const hashedPassword = await bcrypt.hash(password, 10);

    const qrCode = `USR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Parse children data
    let children: { name: string; birthDate: string }[] = [];
    if (childrenJson) {
        try {
            children = JSON.parse(childrenJson);
        } catch {
            // Ignore invalid JSON
        }
    }

    await prisma.user.create({
        data: {
            parentName,
            phone,
            password: hashedPassword,
            qrCode,
            children: {
                create: children
                    .filter((c) => c.name)
                    .map((c) => ({
                        name: c.name,
                        birthDate: c.birthDate ? new Date(c.birthDate) : new Date(),
                    })),
            },
        },
    });

    return { success: true };
}
