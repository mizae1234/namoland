const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ select: { id: true, phone: true } });
    const nonDigit = users.filter(u => /\D/.test(u.phone));
    console.log("Users with non-digit phones:", nonDigit.length);
    if (nonDigit.length > 0) {
        console.log(nonDigit.slice(0, 5));
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
