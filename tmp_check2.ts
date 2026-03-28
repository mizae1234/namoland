import prisma from './src/lib/prisma';

async function main() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Coins Used (Redeemed)
  const txThisMonth = await prisma.coinTransaction.aggregate({
    _sum: { coinsUsed: true },
    where: { createdAt: { gte: monthStart }, type: { notIn: ["BOOK_DEPOSIT", "BOOK_DEPOSIT_RETURN"] } }
  });

  const txLastMonth = await prisma.coinTransaction.aggregate({
    _sum: { coinsUsed: true },
    where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, type: { notIn: ["BOOK_DEPOSIT", "BOOK_DEPOSIT_RETURN"] } }
  });

  // Package Coins Purchased
  const ptThisMonth = await prisma.coinPackage.aggregate({
    _sum: { totalCoins: true },
    where: { purchaseDate: { gte: monthStart } }
  });

  const ptLastMonth = await prisma.coinPackage.aggregate({
    _sum: { totalCoins: true },
    where: { purchaseDate: { gte: lastMonthStart, lte: lastMonthEnd } }
  });

  console.log("Coins Redeemed This Month:", txThisMonth._sum.coinsUsed);
  console.log("Coins Redeemed Last Month:", txLastMonth._sum.coinsUsed);
  console.log("Coins Purchased This Month:", ptThisMonth._sum.totalCoins);
  console.log("Coins Purchased Last Month:", ptLastMonth._sum.totalCoins);

}
main().then(() => prisma.$disconnect());
