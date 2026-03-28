import prisma from './src/lib/prisma';

async function main() {
  const tx = await prisma.coinTransaction.findFirst({
    where: { 
      createdAt: { gte: new Date("2026-03-19T00:00:00Z"), lte: new Date("2026-03-19T23:59:59Z") },
      coinsUsed: 3
    }
  });

  if (tx) {
    await prisma.coinTransaction.update({
      where: { id: tx.id },
      data: { createdAt: new Date("2026-02-25T10:00:00Z") }
    });
    console.log("Updated transaction", tx.id, "to Feb 25, 2026");
  } else {
    console.log("Transaction not found");
  }
}

main().then(() => prisma.$disconnect());
