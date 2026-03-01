"use server";

import prisma from "@/lib/prisma";

export async function getOwnerDashboardData() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ─── KPI Cards ───────────────────────────────────
    const [
        todayPackages,
        yesterdayPackages,
        thisMonthPackages,
        lastMonthPackages,
        borrowedCount,
        overdueRecords,
        totalRemainingCoins,
    ] = await Promise.all([
        // Today revenue
        prisma.coinPackage.findMany({
            where: { createdAt: { gte: todayStart } },
            select: { pricePaid: true },
        }),
        // Yesterday revenue
        prisma.coinPackage.findMany({
            where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
            select: { pricePaid: true },
        }),
        // This month revenue
        prisma.coinPackage.findMany({
            where: { createdAt: { gte: monthStart } },
            select: { pricePaid: true },
        }),
        // Last month revenue
        prisma.coinPackage.findMany({
            where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            select: { pricePaid: true },
        }),
        // Currently rented
        prisma.borrowRecord.count({
            where: { status: "BORROWED" },
        }),
        // Overdue
        prisma.borrowRecord.findMany({
            where: {
                status: "BORROWED",
                dueDate: { lt: now },
            },
            include: { user: true, items: { include: { book: true } } },
        }),
        // Total remaining coins in system
        prisma.coinPackage.aggregate({
            _sum: { remainingCoins: true },
            where: { isExpired: false },
        }),
    ]);

    const todayRevenue = todayPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const yesterdayRevenue = yesterdayPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const thisMonthRevenue = thisMonthPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const lastMonthRevenue = lastMonthPackages.reduce((s, p) => s + Number(p.pricePaid), 0);
    const revenueChangePercent = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : todayRevenue > 0 ? 100 : 0;

    // ─── Revenue Trend (last 30 days) ──────────────
    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allPackagesLast30d = await prisma.coinPackage.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { pricePaid: true, createdAt: true },
    });

    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayRevenue = allPackagesLast30d
            .filter((p) => p.createdAt >= d && p.createdAt < nextD)
            .reduce((s, p) => s + Number(p.pricePaid), 0);
        revenueTrend.push({ date: label, revenue: dayRevenue });
    }

    // ─── Business Alerts ────────────────────────────
    const overdueMoreThan3Days = overdueRecords.filter((r) => {
        const diffDays = Math.floor((now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 3;
    });

    const expiringPackages = await prisma.coinPackage.findMany({
        where: {
            isExpired: false,
            expiresAt: { not: null, lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            remainingCoins: { gt: 0 },
        },
        include: { user: true },
    });

    const thirtyDaysAgoDate = new Date(now);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);

    const deadStockBooks = await prisma.book.findMany({
        where: {
            isActive: true,
            borrowItems: {
                none: {
                    borrowRecord: { borrowDate: { gte: thirtyDaysAgoDate } },
                },
            },
        },
        select: { id: true, title: true, qrCode: true, category: true },
    });

    const lowCoinUsers = await prisma.coinPackage.findMany({
        where: {
            isExpired: false,
            remainingCoins: { gt: 0, lte: 3 },
        },
        include: { user: true },
    });

    // ─── Top Performance ────────────────────────────
    const allBorrowItems = await prisma.borrowItem.findMany({
        include: {
            book: true,
            borrowRecord: { select: { rentalCoins: true } },
        },
    });

    const bookRentalMap = new Map<string, { title: string; count: number; coins: number }>();
    for (const item of allBorrowItems) {
        const existing = bookRentalMap.get(item.bookId);
        if (existing) {
            existing.count += 1;
            existing.coins += item.borrowRecord.rentalCoins;
        } else {
            bookRentalMap.set(item.bookId, {
                title: item.book.title,
                count: 1,
                coins: item.borrowRecord.rentalCoins,
            });
        }
    }

    const topBooks = Array.from(bookRentalMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // ─── Customer Insights ──────────────────────────
    const newMembersThisMonth = await prisma.user.count({
        where: { createdAt: { gte: monthStart } },
    });

    const topSpendingMembers = await prisma.coinPackage.groupBy({
        by: ["userId"],
        _sum: { pricePaid: true },
        orderBy: { _sum: { pricePaid: "desc" } },
        take: 3,
    });

    const topSpendingUserIds = topSpendingMembers.map((m) => m.userId);
    const topSpendingUsers = await prisma.user.findMany({
        where: { id: { in: topSpendingUserIds } },
        select: { id: true, parentName: true, phone: true },
    });

    const topSpenders = topSpendingMembers.map((m) => {
        const user = topSpendingUsers.find((u) => u.id === m.userId);
        return {
            name: user?.parentName || "-",
            phone: user?.phone || "",
            totalSpent: Number(m._sum.pricePaid || 0),
        };
    });

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const inactiveMembers = await prisma.user.findMany({
        where: {
            coinPackages: {
                none: {
                    createdAt: { gte: sixtyDaysAgo },
                },
            },
            borrowRecords: {
                none: {
                    createdAt: { gte: sixtyDaysAgo },
                },
            },
        },
        select: { id: true, parentName: true },
    });

    // ─── Financial Summary ──────────────────────────
    const totalCoinsPurchased = await prisma.coinPackage.aggregate({
        _sum: { totalCoins: true },
        where: { createdAt: { gte: monthStart } },
    });

    const totalCoinsRedeemed = await prisma.coinTransaction.aggregate({
        _sum: { coinsUsed: true },
        where: { createdAt: { gte: monthStart } },
    });

    return {
        kpi: {
            todayRevenue,
            yesterdayRevenue,
            thisMonthRevenue,
            lastMonthRevenue,
            revenueChangePercent,
            borrowedCount,
            overdueCount: overdueRecords.length,
            totalRemainingCoins: totalRemainingCoins._sum.remainingCoins || 0,
        },
        revenueTrend,
        alerts: {
            overdueMoreThan3Days: overdueMoreThan3Days.map((r) => ({
                code: r.code,
                parentName: r.user.parentName,
                dueDate: r.dueDate.toISOString(),
                daysPast: Math.floor((now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
                books: r.items.map((i) => i.book.title),
            })),
            expiringPackages: expiringPackages.map((p) => ({
                userName: p.user.parentName,
                remainingCoins: p.remainingCoins,
                expiresAt: p.expiresAt?.toISOString() || "",
            })),
            deadStockBooks: deadStockBooks.map((b) => ({
                title: b.title,
                qrCode: b.qrCode,
                category: b.category,
            })),
            lowCoinUsers: lowCoinUsers.map((p) => ({
                userName: p.user.parentName,
                remainingCoins: p.remainingCoins,
            })),
        },
        topBooks,
        customerInsights: {
            newMembersThisMonth,
            topSpenders,
            inactiveMembers: inactiveMembers.map((m) => m.parentName),
        },
        financial: {
            thisMonthRevenue,
            lastMonthRevenue,
            coinsPurchased: totalCoinsPurchased._sum.totalCoins || 0,
            coinsRedeemed: totalCoinsRedeemed._sum.coinsUsed || 0,
        },
    };
}
