const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const bookings = await prisma.classBooking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { classEntry: true }
    });
    console.log("Bookings:", JSON.stringify(bookings, null, 2));

    const txs = await prisma.coinTransaction.findMany({
        where: { type: "CLASS_FEE" },
        orderBy: { createdAt: "desc" },
        take: 5
    });
    console.log("Txs:", JSON.stringify(txs, null, 2));
}
main().finally(() => prisma.$disconnect());
