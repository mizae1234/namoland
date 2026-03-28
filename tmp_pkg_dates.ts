import prisma from './src/lib/prisma';

async function main() {
  const pkgs = await prisma.coinPackage.findMany({
    select: { id: true, pricePaid: true, totalCoins: true, purchaseDate: true },
    orderBy: { purchaseDate: 'asc' }
  });

  for (const p of pkgs) {
    console.log(`${p.purchaseDate.toISOString()} | Cash: ${p.pricePaid} | Coins: ${p.totalCoins}`);
  }
}

main().then(() => prisma.$disconnect());
