import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    const bookings = await prisma.classBooking.findMany({
        where: { userId },
        include: {
            classEntry: {
                select: {
                    title: true,
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                },
            },
            child: { select: { name: true } },
            bookedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const result = bookings.map((b) => ({
        id: b.id,
        status: b.status,
        coinsCharged: b.coinsCharged,
        checkedInAt: b.checkedInAt?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
        note: b.note,
        childName: b.child?.name || null,
        className: b.classEntry.title,
        dayOfWeek: b.classEntry.dayOfWeek,
        startTime: b.classEntry.startTime,
        endTime: b.classEntry.endTime,
        bookedByName: b.bookedBy.name || "Admin",
    }));

    return NextResponse.json(result);
}
