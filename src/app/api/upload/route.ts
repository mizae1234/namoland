import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP" },
                { status: 400 }
            );
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "ไฟล์ต้องไม่เกิน 5MB" },
                { status: 400 }
            );
        }

        // Ensure upload directory exists (in persistent storage area)
        const uploadDir = path.join(process.cwd(), "uploads");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `schedule_${Date.now()}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        const url = `/uploads/${filename}`;

        // Save to DB
        let shop = await prisma.shopInfo.findFirst();
        if (!shop) {
            shop = await prisma.shopInfo.create({
                data: { shopName: "Namoland" },
            });
        }
        await prisma.shopInfo.update({
            where: { id: shop.id },
            data: { scheduleImageUrl: url },
        });

        // Revalidate cached pages
        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json({ url });
    } catch (err) {
        console.error("Upload error:", err);
        return NextResponse.json(
            { error: `อัพโหลดไม่สำเร็จ: ${err instanceof Error ? err.message : "unknown error"}` },
            { status: 500 }
        );
    }
}

// DELETE handler to remove schedule image
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const shop = await prisma.shopInfo.findFirst();
        if (shop) {
            await prisma.shopInfo.update({
                where: { id: shop.id },
                data: { scheduleImageUrl: null },
            });
        }

        revalidatePath("/settings");
        revalidatePath("/");

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete error:", err);
        return NextResponse.json(
            { error: "ลบไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
