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
        orderBy: { createdAt: "asc" },
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
                date: new Date(pkg.createdAt),
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
