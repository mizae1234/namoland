import prisma from './src/lib/prisma';
import { getOutstandingCoinReport } from './src/actions/report';

async function main() {
    const report = await getOutstandingCoinReport(2026);
    const mar = report.months.find(m => m.month === 'Mar');
    console.log("Current WAC Amount:", mar?.amount);
    console.log("Current WAC Discount:", mar?.discount);

    // Now calculate exact Remaining
    const yearEnd = new Date(2027, 0, 1);
    const allPackages = await prisma.coinPackage.findMany({
        where: { purchaseDate: { lt: yearEnd }, packageType: { not: "ADJUSTMENT" } },
        select: { id: true, totalCoins: true, pricePaid: true, bonusAmount: true, packageType: true, purchaseDate: true }
    });
    const allTransactions = await prisma.coinTransaction.findMany({
        where: { createdAt: { lt: yearEnd } },
        select: { packageId: true, coinsUsed: true, type: true, createdAt: true }
    });

    const pkgData = allPackages.map(pkg => {
        const txs = allTransactions.filter(t => t.packageId === pkg.id);
        const adjustUpAllTime = txs.filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0).reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
        const origCoins = pkg.packageType !== "ADJUSTMENT" ? pkg.totalCoins - adjustUpAllTime : 0;
        const rate = origCoins > 0 ? Number(pkg.pricePaid) / origCoins : 0;
        const grossRate = origCoins > 0 ? (Number(pkg.pricePaid) + Number(pkg.bonusAmount)) / origCoins : 0;
        const discountRate = origCoins > 0 ? Number(pkg.bonusAmount) / origCoins : 0;
        return { ...pkg, origCoins, rate, grossRate, discountRate, txs };
    });

    const time = new Date(2026, 3, 1); // Exact end of March
    let exactAmount = 0;
    let exactDiscount = 0;
    for (const p of pkgData) {
        if (p.purchaseDate >= time) continue;
        const consumedBeforeT = p.txs
            .filter(t => t.createdAt < time && t.coinsUsed > 0)
            .reduce((s, t) => s + t.coinsUsed, 0);
        
        const paidConsumed = Math.min(consumedBeforeT, p.origCoins);
        exactAmount += (Number(p.pricePaid) - (paidConsumed * p.rate));
        exactDiscount += (Number(p.bonusAmount) - (paidConsumed * p.discountRate));
    }

    console.log("Exact Amount:", exactAmount);
    console.log("Exact Discount:", exactDiscount);
}
main().then(() => prisma.$disconnect());
