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
                    schedule: {
                        select: { startDate: true }
                    }
                },
            },
            child: { select: { name: true } },
            bookedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const result = bookings.map((b) => {
        let classDateIso = b.createdAt.toISOString();
        if (b.classEntry?.schedule?.startDate) {
            const classDate = new Date(b.classEntry.schedule.startDate.getTime());
            classDate.setUTCHours(classDate.getUTCHours() + 7);
            classDate.setUTCDate(classDate.getUTCDate() + b.classEntry.dayOfWeek);
            classDate.setUTCHours(classDate.getUTCHours() - 7);
            classDateIso = classDate.toISOString();
        }

        return {
            id: b.id,
            recordId: b.id,
            isManual: false,
            status: b.status,
            coinsCharged: b.coinsCharged,
            checkedInAt: b.checkedInAt?.toISOString() || null,
            createdAt: b.createdAt.toISOString(),
            classDate: classDateIso,
            note: b.note,
            childName: b.child?.name || null,
            className: b.classEntry.title,
            dayOfWeek: b.classEntry.dayOfWeek,
            startTime: b.classEntry.startTime,
            endTime: b.classEntry.endTime,
            bookedByName: b.bookedBy.name || "Admin",
        };
    });

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
        recordId: t.id,
        isManual: true,
        status: "CHECKED_IN",
        coinsCharged: t.coinsUsed,
        checkedInAt: t.createdAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        classDate: t.createdAt.toISOString(),
        note: t.description,
        childName: "-",
        className: t.className || t.description || "Activity",
        dayOfWeek: t.createdAt.getDay(),
        startTime: "-",
        endTime: "-",
        bookedByName: t.processedBy?.name || "Admin",
    }));

    const finalResult = [...result, ...manualResults].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(finalResult);
}
