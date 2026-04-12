import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const schedules = await prisma.classSchedule.findMany({
        include: { entries: true },
        take: 5
    });
    console.log(JSON.stringify(schedules, null, 2));
}
main().finally(() => prisma.$disconnect());
