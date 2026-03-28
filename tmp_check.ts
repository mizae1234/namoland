import prisma from './src/lib/prisma';

async function main() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const packagesThisMonth = await prisma.coinPackage.findMany({
     where: { purchaseDate: { gte: monthStart } }
  });

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  const packagesLastMonth = await prisma.coinPackage.findMany({
     where: { purchaseDate: { gte: lastMonthStart, lte: lastMonthEnd } }
  });

  const cashThisMonth = packagesThisMonth.reduce((s, p) => s + Number(p.pricePaid), 0);
  const cashLastMonth = packagesLastMonth.reduce((s, p) => s + Number(p.pricePaid), 0);

  console.log("Cash This Month:", cashThisMonth);
  console.log("Cash Last Month:", cashLastMonth);
}
main().then(() => prisma.$disconnect());
