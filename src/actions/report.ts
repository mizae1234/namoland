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
    const [allPackages, allTransactions, allAdjustTxsEver] = await Promise.all([
        prisma.coinPackage.findMany({
            where: { purchaseDate: { lt: targetYearEnd } },
            select: { id: true, totalCoins: true, pricePaid: true, bonusAmount: true, purchaseDate: true, packageType: true },
        }),
        prisma.coinTransaction.findMany({
            where: { createdAt: { lt: targetYearEnd } },
            select: { packageId: true, type: true, coinsUsed: true, createdAt: true },
        }),
        // Get ALL adjustment txs (no date filter) for correct origCoins calculation
        prisma.coinTransaction.findMany({
            where: { type: "ADJUSTMENT", coinsUsed: { lt: 0 } },
            select: { packageId: true, coinsUsed: true },
        }),
    ]);

    // Precompute per-package adjustUpTotal (total coins ever added via adjustCoinsUp)
    const adjustUpTotalByPkg = new Map<string, number>();
    for (const tx of allAdjustTxsEver) {
        const current = adjustUpTotalByPkg.get(tx.packageId) || 0;
        adjustUpTotalByPkg.set(tx.packageId, current + Math.abs(tx.coinsUsed));
    }

    const snapshotAt = (date: Date) => {
        let balance = 0;
        let amount = 0;
        let discount = 0;
        let grossAmount = 0;

        for (const pkg of allPackages) {
            if (pkg.purchaseDate >= date) continue;

            const pkgTxs = allTransactions.filter(t => t.packageId === pkg.id);
            const adjustUpTotal = adjustUpTotalByPkg.get(pkg.id) || 0;
            const origCoins = pkg.totalCoins - adjustUpTotal;

            // Reconstruct totalCoins at the snapshot date
            const adjustUpBeforeDate = pkgTxs
                .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0 && t.createdAt < date)
                .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
            const totalCoinsAtDate = origCoins + adjustUpBeforeDate;

            // Calculate consumption (only positive coinsUsed = actual spending)
            const positiveConsumed = pkgTxs
                .filter(t => t.coinsUsed > 0 && t.createdAt < date)
                .reduce((s, t) => s + t.coinsUsed, 0);

            const remaining = Math.max(0, totalCoinsAtDate - positiveConsumed);

            if (remaining > 0) {
                balance += remaining;

                // Monetary values: only count paid (original) coins, adjusted coins are free
                if (origCoins > 0) {
                    const paidConsumed = Math.min(positiveConsumed, origCoins);
                    const paidRemaining = Math.max(0, origCoins - paidConsumed);
                    const ratio = paidRemaining / origCoins;
                    amount += Number(pkg.pricePaid) * ratio;
                    discount += Number(pkg.bonusAmount) * ratio;
                    grossAmount += (Number(pkg.pricePaid) + Number(pkg.bonusAmount)) * ratio;
                }
            }
        }

        return { balance, amount, discount, grossAmount };
    };

    const bfDate = new Date(year, 0, 1);
    const bf = snapshotAt(bfDate);

    const months: MonthRow[] = [];
    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 1);

        // Purchase: use origCoins (exclude adjusted coins) for non-ADJUSTMENT packages
        const monthPackages = allPackages.filter(
            p => p.purchaseDate >= monthStart && p.purchaseDate < monthEnd && p.packageType !== "ADJUSTMENT"
        );
        const purchase = monthPackages.reduce((s, p) => {
            const adjUp = adjustUpTotalByPkg.get(p.id) || 0;
            return s + (p.totalCoins - adjUp);
        }, 0);

        // AdjustUp: count from ADJUSTMENT transactions in the month (handles both existing pkg adjustments and new ADJUSTMENT packages)
        const monthTransactions = allTransactions.filter(t => t.createdAt >= monthStart && t.createdAt < monthEnd);
        const adjustUp = monthTransactions
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);

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

// ─── Outstanding Coin Detail (per-member breakdown) ──────────────────

export type OutstandingCoinDetailRow = {
    userId: string;
    memberName: string;
    childrenNames: string;
    phone: string;
    coinBalance: number;
    amount: number;
    grossAmount: number;
    discount: number;
};

export type OutstandingCoinDetailData = {
    year: number;
    month: string;
    monthIndex: number;
    rows: OutstandingCoinDetailRow[];
    totals: { coinBalance: number; amount: number; grossAmount: number; discount: number };
};

export async function getOutstandingCoinDetail(year: number, monthIndex: number): Promise<OutstandingCoinDetailData> {
    const monthEnd = new Date(year, monthIndex + 1, 1);

    const [allPackages, allTransactions, allAdjustTxsEver] = await Promise.all([
        prisma.coinPackage.findMany({
            where: { purchaseDate: { lt: monthEnd } },
            select: {
                id: true, totalCoins: true, pricePaid: true, bonusAmount: true,
                purchaseDate: true, packageType: true, userId: true,
                user: { select: { parentName: true, phone: true, children: { select: { name: true } } } },
            },
        }),
        prisma.coinTransaction.findMany({
            where: { createdAt: { lt: monthEnd } },
            select: { packageId: true, type: true, coinsUsed: true, createdAt: true },
        }),
        prisma.coinTransaction.findMany({
            where: { type: "ADJUSTMENT", coinsUsed: { lt: 0 } },
            select: { packageId: true, coinsUsed: true },
        }),
    ]);

    const adjustUpTotalByPkg = new Map<string, number>();
    for (const tx of allAdjustTxsEver) {
        const current = adjustUpTotalByPkg.get(tx.packageId) || 0;
        adjustUpTotalByPkg.set(tx.packageId, current + Math.abs(tx.coinsUsed));
    }

    const userMap = new Map<string, {
        memberName: string; childrenNames: string; phone: string;
        coinBalance: number; amount: number; grossAmount: number; discount: number;
    }>();

    for (const pkg of allPackages) {
        if (pkg.purchaseDate >= monthEnd) continue;

        const pkgTxs = allTransactions.filter(t => t.packageId === pkg.id);
        const adjustUpTotal = adjustUpTotalByPkg.get(pkg.id) || 0;
        const origCoins = pkg.totalCoins - adjustUpTotal;

        const adjustUpBeforeDate = pkgTxs
            .filter(t => t.type === "ADJUSTMENT" && t.coinsUsed < 0 && t.createdAt < monthEnd)
            .reduce((s, t) => s + Math.abs(t.coinsUsed), 0);
        const totalCoinsAtDate = origCoins + adjustUpBeforeDate;

        const positiveConsumed = pkgTxs
            .filter(t => t.coinsUsed > 0 && t.createdAt < monthEnd)
            .reduce((s, t) => s + t.coinsUsed, 0);

        const remaining = Math.max(0, totalCoinsAtDate - positiveConsumed);
        if (remaining <= 0) continue;

        let amt = 0, disc = 0, gross = 0;
        if (origCoins > 0) {
            const paidConsumed = Math.min(positiveConsumed, origCoins);
            const paidRemaining = Math.max(0, origCoins - paidConsumed);
            const ratio = paidRemaining / origCoins;
            amt = Number(pkg.pricePaid) * ratio;
            disc = Number(pkg.bonusAmount) * ratio;
            gross = amt + disc;
        }

        const childrenNames = pkg.user.children.map((c: any) => c.name).join(", ");
        const existing = userMap.get(pkg.userId) || {
            memberName: pkg.user.parentName, childrenNames, phone: pkg.user.phone,
            coinBalance: 0, amount: 0, grossAmount: 0, discount: 0,
        };
        existing.coinBalance += remaining;
        existing.amount += amt;
        existing.grossAmount += gross;
        existing.discount += disc;
        userMap.set(pkg.userId, existing);
    }

    const rows: OutstandingCoinDetailRow[] = Array.from(userMap.entries())
        .map(([userId, data]) => ({
            userId,
            memberName: data.memberName,
            childrenNames: data.childrenNames,
            phone: data.phone,
            coinBalance: data.coinBalance,
            amount: Math.round(data.amount * 100) / 100,
            grossAmount: Math.round(data.grossAmount * 100) / 100,
            discount: Math.round(data.discount * 100) / 100,
        }))
        .sort((a, b) => b.amount - a.amount);

    const totals = {
        coinBalance: rows.reduce((s, r) => s + r.coinBalance, 0),
        amount: Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100,
        grossAmount: Math.round(rows.reduce((s, r) => s + r.grossAmount, 0) * 100) / 100,
        discount: Math.round(rows.reduce((s, r) => s + r.discount, 0) * 100) / 100,
    };

    return {
        year,
        month: MONTH_NAMES[monthIndex],
        monthIndex,
        rows,
        totals,
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

    // 1) ClassBooking records (from class schedule bookings and check-ins via Use Coins with classEntryId)
    const bookings = await prisma.classBooking.findMany({
        where,
        include: {
            classEntry: true,
            user: { select: { parentName: true, phone: true, children: { select: { name: true } } } },
            child: { select: { name: true } },
            bookedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Collect classBooking IDs that reference a transaction via description matching
    const bookingClassEntryIds = new Set(bookings.map(b => b.classEntryId));

    // 2) CoinTransaction CLASS_FEE records that DON'T have a ClassBooking (manual coin usage from Use Coins page)
    //    These have description NOT starting with "Check-in: " (those have ClassBooking already)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manualTxWhere: any = {
        type: "CLASS_FEE",
        createdAt: { gte: from, lte: to },
        NOT: {
            description: { startsWith: "Check-in: " },
        },
    };

    if (search && search.trim()) {
        const q = search.trim();
        manualTxWhere.OR = [
            { package: { user: { parentName: { contains: q, mode: "insensitive" } } } },
            { className: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ];
    }

    // Skip manual txs if filtering by booking-specific status
    const skipManualTxs = status && status !== "ALL" && status !== "CHECKED_IN";

    const manualTxs = skipManualTxs ? [] : await prisma.coinTransaction.findMany({
        where: manualTxWhere,
        include: {
            package: {
                include: {
                    user: { select: { parentName: true, phone: true, children: { select: { name: true } } } },
                },
            },
            processedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Deduplicate: group manual txs by unique (userId+createdAt rounded to minute) to avoid FIFO split duplicates
    const seenManualKeys = new Set<string>();
    const dedupedManualTxs = manualTxs.filter(tx => {
        const key = `${tx.package.userId}_${tx.className}_${Math.floor(tx.createdAt.getTime() / 60000)}`;
        if (seenManualKeys.has(key)) return false;
        seenManualKeys.add(key);
        return true;
    });

    // Aggregate coins for deduplicated manual txs (sum split FIFO entries)
    const manualCoinsMap = new Map<string, number>();
    for (const tx of manualTxs) {
        const key = `${tx.package.userId}_${tx.className}_${Math.floor(tx.createdAt.getTime() / 60000)}`;
        manualCoinsMap.set(key, (manualCoinsMap.get(key) || 0) + tx.coinsUsed);
    }

    // Build rows from ClassBooking
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

    // Append manual CoinTransaction rows
    for (const tx of dedupedManualTxs) {
        const key = `${tx.package.userId}_${tx.className}_${Math.floor(tx.createdAt.getTime() / 60000)}`;
        const totalCoins = manualCoinsMap.get(key) || tx.coinsUsed;

        // Parse time from description if available (e.g. "Free Play (1h)")
        const descMatch = tx.description?.match(/\((.+?)\)/);
        const timeInfo = descMatch?.[1] || "";

        rows.push({
            id: `tx-${tx.id}`,
            className: tx.className || tx.description || "Use Coins",
            startTime: "",
            endTime: "",
            dayOfWeek: tx.createdAt.getDay() === 0 ? 6 : tx.createdAt.getDay() - 1, // Convert JS day to Mon=0
            participantName: tx.package.user.children?.[0]?.name || tx.package.user.parentName,
            parentName: tx.package.user.parentName,
            phone: tx.package.user.phone,
            status: "CHECKED_IN",
            coinsCharged: totalCoins,
            checkedInAt: tx.createdAt.toISOString(),
            createdAt: tx.createdAt.toISOString(),
            bookedByName: tx.processedBy.name,
        });
    }

    // Sort all rows by createdAt descending
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

// ─── Financial Report (Monthly Income & Deductions) ──────────────────

export type FinancialMonthRow = {
    month: string;
    monthIndex: number;
    income: number;        // Sum of pricePaid (THB) from CoinPackage
    deductions: number;    // Sum of coinsUsed from CoinTransaction (positive = spent)
};

export type FinancialReportData = {
    year: number;
    months: FinancialMonthRow[];
    totalIncome: number;
    totalDeductions: number;
    availableYears: number[];
};

export async function getFinancialReport(year: number): Promise<FinancialReportData> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Determine available years from CoinPackage dates
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

    const [packages, transactions] = await Promise.all([
        prisma.coinPackage.findMany({
            where: {
                purchaseDate: { gte: yearStart, lt: yearEnd },
                packageType: { not: "ADJUSTMENT" },
            },
            select: { pricePaid: true, purchaseDate: true },
        }),
        prisma.coinTransaction.findMany({
            where: {
                createdAt: { gte: yearStart, lt: yearEnd },
                coinsUsed: { gt: 0 },
                type: { notIn: ["ADJUSTMENT", "EXTENSION", "EXPIRED"] },
            },
            select: { coinsUsed: true, createdAt: true },
        }),
    ]);

    const months: FinancialMonthRow[] = [];
    let totalIncome = 0;
    let totalDeductions = 0;

    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 1);

        const income = packages
            .filter(p => p.purchaseDate >= monthStart && p.purchaseDate < monthEnd)
            .reduce((s, p) => s + Number(p.pricePaid), 0);

        const deductions = transactions
            .filter(t => t.createdAt >= monthStart && t.createdAt < monthEnd)
            .reduce((s, t) => s + t.coinsUsed, 0);

        totalIncome += income;
        totalDeductions += deductions;

        months.push({
            month: MONTH_NAMES[m],
            monthIndex: m,
            income: Math.round(income * 100) / 100,
            deductions,
        });
    }

    return {
        year,
        months,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalDeductions,
        availableYears,
    };
}

function formatReportDate(d: Date): string {
    const bkkDate = new Date(d.getTime() + 7 * 60 * 60 * 1000); // Shift to BKK time (+7 hours)
    const day = bkkDate.getUTCDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[bkkDate.getUTCMonth()];
    const year = bkkDate.getUTCFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}
