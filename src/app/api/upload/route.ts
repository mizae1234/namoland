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
        const type = (formData.get("type") as string) || "monthly";
        const activityId = (formData.get("activityId") as string) || null;

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

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), "uploads");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        let prefix = type === "weekly" ? "weekly_schedule" : "schedule";
        if (type === "activityIcon") prefix = "activity_icon";
        const filename = `${prefix}_${Date.now()}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        const url = `/uploads/${filename}`;

        if (type === "activityIcon" && activityId) {
            // Save to ActivityConfig
            await prisma.activityConfig.update({
                where: { id: activityId },
                data: { iconImageUrl: url },
            });
            revalidatePath("/activities");
            revalidatePath("/");
        } else {
            // Save to ShopInfo (schedule images)
            let shop = await prisma.shopInfo.findFirst();
            if (!shop) {
                shop = await prisma.shopInfo.create({
                    data: { shopName: "Namoland" },
                });
            }

            const dbField = type === "weekly" ? "weeklyScheduleImageUrl" : "scheduleImageUrl";
            await prisma.shopInfo.update({
                where: { id: shop.id },
                data: { [dbField]: url },
            });

            revalidatePath("/settings");
            revalidatePath("/");
        }

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
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.type !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "monthly";
        const activityId = searchParams.get("activityId");

        if (type === "activityIcon" && activityId) {
            await prisma.activityConfig.update({
                where: { id: activityId },
                data: { iconImageUrl: null },
            });
            revalidatePath("/activities");
            revalidatePath("/");
        } else {
            const shop = await prisma.shopInfo.findFirst();
            if (shop) {
                const dbField = type === "weekly" ? "weeklyScheduleImageUrl" : "scheduleImageUrl";
                await prisma.shopInfo.update({
                    where: { id: shop.id },
                    data: { [dbField]: null },
                });
            }
            revalidatePath("/settings");
            revalidatePath("/");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete error:", err);
        return NextResponse.json(
            { error: "ลบไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
