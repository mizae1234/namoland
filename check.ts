import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const bookings = await prisma.classBooking.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { classEntry: true, child: true, user: true }
    });
    console.log(JSON.stringify(bookings.map(b => ({
        id: b.id,
        className: b.classEntry?.title,
        childName: b.child?.name,
        dayOfWeek: b.classEntry?.dayOfWeek,
        startTime: b.classEntry?.startTime,
        endTime: b.classEntry?.endTime,
        createdAt: b.createdAt
    })), null, 2));
}
main().finally(() => prisma.$disconnect());
