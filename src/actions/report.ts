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
    const earliestPackage = await prisma.coinPackage.findFirst({
        orderBy: { purchaseDate: "asc" },
        select: { purchaseDate: true },
    });
    const latestPackage = await prisma.coinPackage.findFirst({
        orderBy: { purchaseDate: "desc" },
        select: { purchaseDate: true },
    });

    const startYear = earliestPackage ? earliestPackage.purchaseDate.getFullYear() : year;
    const endYear = latestPackage ? latestPackage.purchaseDate.getFullYear() : year;
    const availableYears: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
        availableYears.push(y);
    }
    if (!availableYears.includes(year)) {
        availableYears.push(year);
    }
    availableYears.sort((a, b) => b - a);

    const targetYearEnd = new Date(year + 1, 0, 1);
    const [allPackages, allTransactions, allAdjustPackages] = await Promise.all([
        prisma.coinPackage.findMany({
            where: { purchaseDate: { lt: targetYearEnd }, packageType: { not: "ADJUSTMENT" } },
            select: { id: true, totalCoins: true, pricePaid: true, bonusAmount: true, purchaseDate: true },
        }),
        prisma.coinTransaction.findMany({
            where: { createdAt: { lt: targetYearEnd } },
            select: { packageId: true, type: true, coinsUsed: true, createdAt: true },
        }),
        prisma.coinPackage.findMany({
            where: { purchaseDate: { lt: targetYearEnd }, packageType: "ADJUSTMENT" },
            select: { totalCoins: true, purchaseDate: true },
        })
    ]);

    const snapshotAt = (date: Date) => {
        let balance = 0;
        let amount = 0;
        let discount = 0;
        let grossAmount = 0;

        for (const pkg of allPackages) {
            if (pkg.purchaseDate >= date) continue;

            const txs = allTransactions.filter(t => t.packageId === pkg.id && t.createdAt < date);
            const consumed = txs.reduce((sum, t) => sum + t.coinsUsed, 0);
            const remaining = pkg.totalCoins - consumed;

            if (remaining > 0) {
                balance += remaining;
                const ratio = remaining / pkg.totalCoins;
                amount += Number(pkg.pricePaid) * ratio;
                discount += Number(pkg.bonusAmount) * ratio;
                grossAmount += (Number(pkg.pricePaid) + Number(pkg.bonusAmount)) * ratio;
            }
        }

        for (const adj of allAdjustPackages) {
            if (adj.purchaseDate < date) balance += adj.totalCoins;
        }

        const adminAdded = allTransactions
            .filter(t => t.createdAt < date && t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
        balance += adminAdded;

        return { balance, amount, discount, grossAmount };
    };

    const bfDate = new Date(year, 0, 1);
    const bf = snapshotAt(bfDate);

    const months: MonthRow[] = [];
    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 1);

        const monthPackages = allPackages.filter(p => p.purchaseDate >= monthStart && p.purchaseDate < monthEnd);
        const purchase = monthPackages.reduce((s, p) => s + p.totalCoins, 0);

        const monthAdjustPackages = allAdjustPackages.filter(p => p.purchaseDate >= monthStart && p.purchaseDate < monthEnd);
        const adjustUpFromPackages = monthAdjustPackages.reduce((s, p) => s + p.totalCoins, 0);

        const monthTransactions = allTransactions.filter(t => t.createdAt >= monthStart && t.createdAt < monthEnd);

        const adjustUpFromExisting = monthTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
        const adjustUp = adjustUpFromPackages + adjustUpFromExisting;

        const usage = monthTransactions
            .filter(t => t.type !== "ADJUSTMENT" && t.coinsUsed > 0)
            .reduce((s, t) => s + t.coinsUsed, 0);
        const adjustDown = monthTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed > 0)
            .reduce((s, t) => s + t.coinsUsed, 0);

        const snap = snapshotAt(monthEnd);

        months.push({
            month: MONTH_NAMES[m],
            monthIndex: m,
            coinBalance: snap.balance,
            purchase,
            usage,
            adjustUp,
            adjustDown,
            balance: snap.balance,
            amount: Math.round(snap.amount * 100) / 100,
            grossAmount: Math.round(snap.grossAmount * 100) / 100,
            discount: Math.round(snap.discount * 100) / 100,
            discountPercent: snap.grossAmount > 0 ? Math.round((snap.discount / snap.grossAmount) * 100) / 100 : 0,
        });
    }

    return {
        year,
        bfBalance: bf.balance,
        bfAmount: Math.round(bf.amount * 100) / 100,
        bfGrossAmount: Math.round(bf.grossAmount * 100) / 100,
        bfDiscount: Math.round(bf.discount * 100) / 100,
        bfDiscountPercent: bf.grossAmount > 0 ? Math.round((bf.discount / bf.grossAmount) * 100) / 100 : 0,
        months,
        availableYears,
    };
}

// ─── Class Attendance Report ─────────────────────────────────────────

export type ClassAttendanceRow = {
    id: string;
    className: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    participantName: string;
    parentName: string;
    phone: string;
    status: string;
    coinsCharged: number;
    checkedInAt: string | null;
    createdAt: string;
    bookedByName: string;
};

export type ClassAttendanceReport = {
    rows: ClassAttendanceRow[];
    summary: {
        total: number;
        checkedIn: number;
        booked: number;
        cancelled: number;
        noShow: number;
    };
};

export async function getClassAttendanceReport(
    dateFrom: string,
    dateTo: string,
    status?: string,
    search?: string,
): Promise<ClassAttendanceReport> {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
        createdAt: { gte: from, lte: to },
    };

    if (status && status !== "ALL") {
        where.status = status;
    }

    if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
            { user: { parentName: { contains: q, mode: "insensitive" } } },
            { child: { name: { contains: q, mode: "insensitive" } } },
            { classEntry: { title: { contains: q, mode: "insensitive" } } },
        ];
    }

    const bookings = await prisma.classBooking.findMany({
        where,
        include: {
            classEntry: true,
            user: { select: { parentName: true, phone: true } },
            child: { select: { name: true } },
            bookedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
    });

    const rows: ClassAttendanceRow[] = bookings.map((b) => ({
        id: b.id,
        className: b.classEntry.title,
        startTime: b.classEntry.startTime,
        endTime: b.classEntry.endTime,
        dayOfWeek: b.classEntry.dayOfWeek,
        participantName: b.child?.name || b.user.parentName,
        parentName: b.user.parentName,
        phone: b.user.phone,
        status: b.status,
        coinsCharged: b.coinsCharged,
        checkedInAt: b.checkedInAt?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
        bookedByName: b.bookedBy.name,
    }));

    const summary = {
        total: rows.length,
        checkedIn: rows.filter((r) => r.status === "CHECKED_IN").length,
        booked: rows.filter((r) => r.status === "BOOKED").length,
        cancelled: rows.filter((r) => r.status === "CANCELLED").length,
        noShow: rows.filter((r) => r.status === "NO_SHOW").length,
    };

    return { rows, summary };
}

// ─── Member Coin Report (per member — Excel-friendly format) ─────────

export type MemberReportRow = {
    date: string;       // ISO date
    month: string;      // "Jan", "Feb", etc.
    type: string;       // "B/F", "Purchase", "Class", "Adjust+", "Adjust-", "Expired"
    className: string;  // class or package name
    dateTime: string;   // e.g. "Sat 10:00-11:00"
    amount: number;     // price paid (negative for usage, positive for purchase)
    coinPurchase: number;
    coinUsage: number;
    balance: number;    // running balance
    validUntil: string; // expiry date
};

export type MemberReportData = {
    memberName: string;
    rows: MemberReportRow[];
    monthlyBalance: Record<string, number>; // "Jan" -> balance at end of month
};

const REPORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getMemberReport(userId: string): Promise<MemberReportData> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { parentName: true },
    });

    const packages = await prisma.coinPackage.findMany({
        where: { userId },
        include: {
            transactions: {
                orderBy: { createdAt: "asc" },
            },
        },
        orderBy: { purchaseDate: "asc" },
    });

    // Build timeline events sorted by date
    type RawEvent = {
        date: Date;
        type: string;
        className: string;
        dateTime: string;
        amount: number;
        coinPurchase: number;
        coinUsage: number;
        validUntil: string;
    };

    const events: RawEvent[] = [];

    for (const pkg of packages) {
        const validUntil = pkg.expiresAt
            ? formatReportDate(new Date(pkg.expiresAt))
            : "";

        // For non-ADJUSTMENT packages: calculate original purchase coins
        // adjustCoinsUp increments totalCoins, so we need to subtract those increments
        if (pkg.packageType !== "ADJUSTMENT") {
            // Sum of coins added via adjustCoinsUp (negative coinsUsed ADJUSTMENT transactions)
            const adjustUpOnThisPackage = pkg.transactions
                .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
                .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);

            const originalCoins = pkg.totalCoins - adjustUpOnThisPackage;

            events.push({
                date: new Date(pkg.purchaseDate),
                type: "Purchase",
                className: "",
                dateTime: "",
                amount: Number(pkg.pricePaid),
                coinPurchase: originalCoins,
                coinUsage: 0,
                validUntil,
            });
        }
        // ADJUSTMENT packages: skip the package event — the transaction handles it
        // (avoids double counting)

        // Calculate per-coin rate for this package (baht per coin)
        const adjustUpOnPkg = pkg.transactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
        const origCoins = pkg.packageType !== "ADJUSTMENT"
            ? pkg.totalCoins - adjustUpOnPkg
            : 0;
        const coinRate = origCoins > 0 ? Number(pkg.pricePaid) / origCoins : 0;

        // Track remaining paid (original) coins within this package for FIFO costing
        // Paid coins are consumed first, then free (adjusted) coins at 0 cost
        let paidCoinsRemaining = origCoins;

        // Transactions (already sorted by createdAt ascending)
        for (const tx of pkg.transactions) {
            if (tx.type === "ADJUSTMENT") {
                if (tx.coinsUsed < 0) {
                    // Coins added (adjust up) — free coins, no cost
                    events.push({
                        date: new Date(tx.createdAt),
                        type: "Adjust+",
                        className: tx.description?.replace("[เพิ่ม] ", "") || "ปรับเพิ่มเหรียญ",
                        dateTime: "",
                        amount: 0,
                        coinPurchase: Math.abs(tx.coinsUsed),
                        coinUsage: 0,
                        validUntil,
                    });
                } else {
                    // Coins deducted (adjust down) — calculate cost from paid coins first
                    const fromPaid = Math.min(tx.coinsUsed, paidCoinsRemaining);
                    paidCoinsRemaining -= fromPaid;
                    const cost = fromPaid * coinRate;
                    events.push({
                        date: new Date(tx.createdAt),
                        type: "Adjust-",
                        className: tx.description?.replace("[หัก] ", "") || "ปรับลดเหรียญ",
                        dateTime: "",
                        amount: cost > 0 ? -cost : 0,
                        coinPurchase: 0,
                        coinUsage: tx.coinsUsed,
                        validUntil,
                    });
                }
            } else if (tx.type === "CLASS_FEE") {
                // Calculate how many coins come from paid vs free (adjusted)
                const fromPaid = Math.min(tx.coinsUsed, paidCoinsRemaining);
                paidCoinsRemaining -= fromPaid;
                // fromFree = tx.coinsUsed - fromPaid (at 0 cost)
                const cost = fromPaid * coinRate;
                events.push({
                    date: new Date(tx.createdAt),
                    type: "Class",
                    className: tx.className || "",
                    dateTime: tx.description?.match(/\((.+)\)/)?.[1] || "",
                    amount: cost > 0 ? -cost : 0,
                    coinPurchase: 0,
                    coinUsage: tx.coinsUsed,
                    validUntil,
                });
            } else {
                // BOOK_RENTAL, BOOK_DEPOSIT, etc
                if (tx.coinsUsed > 0) {
                    const fromPaid = Math.min(tx.coinsUsed, paidCoinsRemaining);
                    paidCoinsRemaining -= fromPaid;
                    const cost = fromPaid * coinRate;
                    events.push({
                        date: new Date(tx.createdAt),
                        type: tx.type.replace(/_/g, " "),
                        className: tx.className || tx.description || "",
                        dateTime: "",
                        amount: cost > 0 ? -cost : 0,
                        coinPurchase: 0,
                        coinUsage: tx.coinsUsed,
                        validUntil,
                    });
                } else {
                    // Refund (negative coinsUsed)
                    events.push({
                        date: new Date(tx.createdAt),
                        type: tx.type.replace(/_/g, " "),
                        className: tx.className || tx.description || "",
                        dateTime: "",
                        amount: 0,
                        coinPurchase: Math.abs(tx.coinsUsed),
                        coinUsage: 0,
                        validUntil,
                    });
                }
            }
        }

        // Expired event
        if (pkg.isExpired && pkg.expiresAt) {
            const hasExpiredTx = pkg.transactions.some(t => t.type === "EXPIRED");
            if (!hasExpiredTx) {
                events.push({
                    date: new Date(pkg.expiresAt),
                    type: "Expired",
                    className: "Coin expired",
                    dateTime: "",
                    amount: 0,
                    coinPurchase: 0,
                    coinUsage: pkg.remainingCoins > 0 ? pkg.remainingCoins : 0,
                    validUntil,
                });
            }
        }
    }

    // Sort by date ascending
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Build rows with running balance
    let balance = 0;
    const rows: MemberReportRow[] = [];

    for (const evt of events) {
        balance = balance + evt.coinPurchase - evt.coinUsage;
        rows.push({
            date: formatReportDate(evt.date),
            month: REPORT_MONTHS[evt.date.getMonth()],
            type: evt.type,
            className: evt.className,
            dateTime: evt.dateTime,
            amount: evt.amount,
            coinPurchase: evt.coinPurchase,
            coinUsage: evt.coinUsage,
            balance,
            validUntil: evt.validUntil,
        });
    }

    // Monthly balance summary
    const monthlyBalance: Record<string, number> = {};
    for (const row of rows) {
        monthlyBalance[row.month] = row.balance;
    }

    return {
        memberName: user?.parentName || "Unknown",
        rows,
        monthlyBalance,
    };
}

function formatReportDate(d: Date): string {
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}
