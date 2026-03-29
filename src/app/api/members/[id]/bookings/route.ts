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

    const manualTxs = await prisma.coinTransaction.findMany({
        where: {
            package: { userId },
            type: "CLASS_FEE",
            NOT: {
                description: { startsWith: "Check-in:" },
            },
        },
        include: { processedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
    });

    const manualResults = manualTxs.map((t) => ({
        id: t.id,
        status: "CHECKED_IN",
        coinsCharged: t.coinsUsed,
        checkedInAt: t.createdAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        note: t.description,
        childName: "-",
        className: t.className || t.description || "Activity",
        dayOfWeek: t.createdAt.getDay() === 0 ? 7 : t.createdAt.getDay(),
        startTime: "-",
        endTime: "-",
        bookedByName: t.processedBy?.name || "Admin",
    }));

    const finalResult = [...result, ...manualResults].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(finalResult);
}
