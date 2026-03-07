"use server";

import prisma from "@/lib/prisma";

type MonthRow = {
    month: string;
    monthIndex: number;
    coinBalance: number;
    purchase: number;
    usage: number;
    adjustUp: number;
    adjustDown: number;
    balance: number;
    amount: number;
    grossAmount: number;
    discount: number;
    discountPercent: number;
};

export type OutstandingCoinReport = {
    year: number;
    bfBalance: number;
    bfAmount: number;
    bfGrossAmount: number;
    bfDiscount: number;
    bfDiscountPercent: number;
    months: MonthRow[];
    availableYears: number[];
};

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getOutstandingCoinReport(year: number): Promise<OutstandingCoinReport> {
    // Get available years from data
    const earliestPackage = await prisma.coinPackage.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
    });
    const latestPackage = await prisma.coinPackage.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });

    const startYear = earliestPackage ? earliestPackage.createdAt.getFullYear() : year;
    const endYear = latestPackage ? latestPackage.createdAt.getFullYear() : year;
    const availableYears: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
        availableYears.push(y);
    }
    if (!availableYears.includes(year)) {
        availableYears.push(year);
    }
    availableYears.sort((a, b) => b - a);

    // B/F: everything before Jan 1 of selected year
    const yearStart = new Date(year, 0, 1);

    // Purchases (exclude ADJUSTMENT type packages for clean purchase numbers)
    const bfPackages = await prisma.coinPackage.findMany({
        where: { createdAt: { lt: yearStart } },
        select: { totalCoins: true, remainingCoins: true, pricePaid: true, bonusAmount: true, packageType: true },
    });

    const bfPurchasePackages = bfPackages.filter(p => p.packageType !== "ADJUSTMENT");
    const bfAdjustPackages = bfPackages.filter(p => p.packageType === "ADJUSTMENT");

    const bfPurchase = bfPurchasePackages.reduce((s, p) => s + p.totalCoins, 0);
    const bfGrossAmount = bfPurchasePackages.reduce((s, p) => s + Number(p.pricePaid) + Number(p.bonusAmount), 0);
    const bfAmount = bfPurchasePackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const bfDiscount = bfPurchasePackages.reduce((s, p) => s + Number(p.bonusAmount), 0);

    // Transactions before year
    const bfTransactions = await prisma.coinTransaction.findMany({
        where: { createdAt: { lt: yearStart } },
        select: { coinsUsed: true, type: true },
    });

    // Usage = CLASS_FEE + BORROW_FEE etc (positive coinsUsed, not ADJUSTMENT)
    const bfUsage = bfTransactions
        .filter(t => t.type !== "ADJUSTMENT" && t.coinsUsed > 0)
        .reduce((s, t) => s + t.coinsUsed, 0);

    // Adjustment deductions (type=ADJUSTMENT, positive coinsUsed = deduct)
    const bfAdjustDown = bfTransactions
        .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed > 0)
        .reduce((s, t) => s + t.coinsUsed, 0);

    // Adjustment additions (from adjustment packages or negative coinsUsed transactions)
    const bfAdjustUp = bfAdjustPackages.reduce((s, p) => s + p.totalCoins, 0)
        + bfTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0)
        // But avoid double counting — adjustUp via package totalCoins AND negative transaction
        // Since adjustCoinsUp creates BOTH an increment on totalCoins AND a negative transaction,
        // we should only count one. The package totalCoins increment on existing packages
        // is already baked into bfPurchase (it modified totalCoins which we sum).
        // For ADJUSTMENT type packages (new ones), we count the package.
        // For existing package increments, since totalCoins was incremented on a non-ADJUSTMENT package,
        // it's already in bfPurchase. The negative transaction would double-count.
        // So we should NOT count negative transactions at all — they're just logs.
        - bfTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);

    // Simplified: bfAdjustUp = just from ADJUSTMENT packages
    // Negative transactions are just logs (the actual coins are in totalCoins already)

    const bfBalance = bfPurchase + bfAdjustPackages.reduce((s, p) => s + p.totalCoins, 0) - bfUsage - bfAdjustDown;

    // Build each month
    const months: MonthRow[] = [];
    let runningBalance = bfBalance;

    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 1);

        const monthPackages = await prisma.coinPackage.findMany({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
            select: { totalCoins: true, pricePaid: true, bonusAmount: true, packageType: true },
        });

        const monthTransactions = await prisma.coinTransaction.findMany({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
            select: { coinsUsed: true, type: true },
        });

        // Regular purchases (non-ADJUSTMENT packages)
        const purchasePackages = monthPackages.filter(p => p.packageType !== "ADJUSTMENT");
        const adjustPackages = monthPackages.filter(p => p.packageType === "ADJUSTMENT");

        const purchase = purchasePackages.reduce((s, p) => s + p.totalCoins, 0);
        const adjustUpFromPackages = adjustPackages.reduce((s, p) => s + p.totalCoins, 0);

        // For existing packages that got totalCoins incremented — that increment appears
        // in the original package's totalCoins (not a new package), so we can't easily
        // separate it. But the negative transaction log tells us it happened.
        // We need to count: additions via existing package increments
        const adjustUpFromExisting = monthTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);

        // Total coins actually added to existing packages (not new ADJUSTMENT packages)
        // are in the negative transactions. New ADJUSTMENT packages are separate.
        const adjustUp = adjustUpFromPackages + adjustUpFromExisting;

        // Usage = non-ADJUSTMENT transactions (normal spending)
        const usage = monthTransactions
            .filter(t => t.type !== "ADJUSTMENT" && t.coinsUsed > 0)
            .reduce((s, t) => s + t.coinsUsed, 0);

        // Adjustment deductions (admin deducted coins)
        const adjustDown = monthTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed > 0)
            .reduce((s, t) => s + t.coinsUsed, 0);

        // For the purchase column in the report, we need to account for totalCoins increases
        // on existing packages. Those show up as negative ADJUSTMENT transactions but
        // we already counted them in adjustUp. So purchase = only real purchased packages.
        // But wait — when adjustCoinsUp increments totalCoins on an existing package,
        // that existing package's totalCoins is ALREADY counted in its original month's purchase.
        // So we must NOT double-count. The adjustUp column handles it.

        const amount = purchasePackages.reduce((s, p) => s + Number(p.pricePaid), 0);
        const grossAmount = purchasePackages.reduce((s, p) => s + Number(p.pricePaid) + Number(p.bonusAmount), 0);
        const discount = purchasePackages.reduce((s, p) => s + Number(p.bonusAmount), 0);

        // Net change = purchase + adjustUp - usage - adjustDown
        runningBalance = runningBalance + purchase + adjustUp - usage - adjustDown;

        months.push({
            month: MONTH_NAMES[m],
            monthIndex: m,
            coinBalance: runningBalance,
            purchase,
            usage,
            adjustUp,
            adjustDown,
            balance: runningBalance,
            amount,
            grossAmount,
            discount,
            discountPercent: grossAmount > 0 ? Math.round((discount / grossAmount) * 100) / 100 : 0,
        });
    }

    return {
        year,
        bfBalance,
        bfAmount,
        bfGrossAmount,
        bfDiscount,
        bfDiscountPercent: bfGrossAmount > 0 ? Math.round((bfDiscount / bfGrossAmount) * 100) / 100 : 0,
        months,
        availableYears,
    };
}
