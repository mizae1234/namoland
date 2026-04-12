import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const tx = await prisma.coinTransaction.findFirst({
        where: {
            className: "Namo Little Artist",
            coinsUsed: 3,
        },
        orderBy: { createdAt: "desc" }
    });

    if (tx) {
        console.log("Found transaction:", tx);
        const newDate = new Date(tx.createdAt);
        newDate.setUTCDate(14); // Force to the 14th
        
        await prisma.coinTransaction.update({
            where: { id: tx.id },
            data: { createdAt: newDate }
        });
        
        // Also update classBooking checkedInAt if applicable
        const booking = await prisma.classBooking.findFirst({
             where: { checkedInAt: tx.createdAt }
        });
        if (booking) {
             await prisma.classBooking.update({
                 where: { id: booking.id },
                 data: { checkedInAt: newDate }
             });
             console.log("Updated checkedInAt in ClassBooking:", booking.id);
        }
        
        console.log("Updated transaction Date to:", newDate);
    } else {
        console.log("Transaction not found");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
