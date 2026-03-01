"use server";

import prisma from "@/lib/prisma";

type MonthRow = {
    month: string;
    monthIndex: number;
    coinBalance: number;
    purchase: number;
    usage: number;
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

    const bfPackages = await prisma.coinPackage.findMany({
        where: { createdAt: { lt: yearStart } },
        select: { totalCoins: true, remainingCoins: true, pricePaid: true, bonusAmount: true },
    });

    const bfPurchase = bfPackages.reduce((s, p) => s + p.totalCoins, 0);
    const bfGrossAmount = bfPackages.reduce((s, p) => s + Number(p.pricePaid) + Number(p.bonusAmount), 0);
    const bfAmount = bfPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const bfDiscount = bfPackages.reduce((s, p) => s + Number(p.bonusAmount), 0);

    const bfTransactions = await prisma.coinTransaction.findMany({
        where: { createdAt: { lt: yearStart } },
        select: { coinsUsed: true },
    });
    const bfUsage = bfTransactions.reduce((s, t) => s + t.coinsUsed, 0);
    const bfBalance = bfPurchase - bfUsage;

    // Build each month
    const months: MonthRow[] = [];
    let runningBalance = bfBalance;

    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 1);

        const monthPackages = await prisma.coinPackage.findMany({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
            select: { totalCoins: true, pricePaid: true, bonusAmount: true },
        });

        const monthTransactions = await prisma.coinTransaction.findMany({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
            select: { coinsUsed: true },
        });

        const purchase = monthPackages.reduce((s, p) => s + p.totalCoins, 0);
        const usage = monthTransactions.reduce((s, t) => s + t.coinsUsed, 0);
        const amount = monthPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
        const grossAmount = monthPackages.reduce((s, p) => s + Number(p.pricePaid) + Number(p.bonusAmount), 0);
        const discount = monthPackages.reduce((s, p) => s + Number(p.bonusAmount), 0);

        runningBalance = runningBalance + purchase - usage;

        months.push({
            month: MONTH_NAMES[m],
            monthIndex: m,
            coinBalance: runningBalance,
            purchase,
            usage,
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
