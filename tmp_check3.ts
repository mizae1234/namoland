import prisma from "./src/lib/prisma";
async function main() {
    const admins = await prisma.adminUser.findMany();
    console.log("Admins:", admins);
}
main();
