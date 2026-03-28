import prisma from './src/lib/prisma';

async function main() {
  const txs = await prisma.coinTransaction.findMany({
    where: { type: { notIn: ["BOOK_DEPOSIT", "BOOK_DEPOSIT_RETURN"] } },
    select: { id: true, coinsUsed: true, type: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  for (const t of txs) {
    console.log(`${t.createdAt.toISOString()} | Coins: ${t.coinsUsed} | Type: ${t.type}`);
  }
}

main().then(() => prisma.$disconnect());
