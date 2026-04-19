import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, phone: true } });
        let updatedCount = 0;
        
        for (const user of users) {
            const cleaned = user.phone.replace(/\D/g, "");
            if (cleaned !== user.phone) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { phone: cleaned }
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
