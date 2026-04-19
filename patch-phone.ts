import prisma from "./src/lib/prisma";

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, phone: true } });
    let updatedCount = 0;
    
    for (const user of users) {
        const cleaned = user.phone.replace(/\D/g, "");
        if (cleaned !== user.phone) {
            console.log(`Updating ${user.phone} -> ${cleaned}`);
            await prisma.user.update({
                where: { id: user.id },
                data: { phone: cleaned }
            });
            updatedCount++;
        }
    }
    console.log(`Successfully updated ${updatedCount} phone numbers.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
