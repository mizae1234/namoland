import prisma from "@/lib/prisma";
import {
    Users,
    Coins,
    BookOpen,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { COIN_TX_TYPE_MAP } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

async function getDashboardStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalMembers,
        totalChildren,
        activePackages,
        borrowedBooks,
        expiringPackages,
        totalCoinsPurchased,
        totalCoinsRedeemed,
        remainingCoinsAgg,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.child.count(),
        prisma.coinPackage.count({
            where: { isExpired: false, remainingCoins: { gt: 0 } },
        }),
        prisma.borrowRecord.count({
            where: { status: "BORROWED" },
        }),
        prisma.coinPackage.count({
            where: {
                isExpired: false,
                expiresAt: {
                    not: null,
                    lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                remainingCoins: { gt: 0 },
            },
        }),
        prisma.coinPackage.aggregate({
            _sum: { totalCoins: true },
            where: { purchaseDate: { gte: monthStart } },
        }),
        prisma.coinTransaction.aggregate({
            _sum: { coinsUsed: true },
            where: { createdAt: { gte: monthStart } },
        }),
        prisma.coinPackage.aggregate({
            _sum: { remainingCoins: true },
            where: { isExpired: false, remainingCoins: { gt: 0 } },
        }),
    ]);

    return {
        totalMembers,
        totalChildren,
        activePackages,
        borrowedBooks,
        expiringPackages,
        coinsPurchasedThisMonth: totalCoinsPurchased._sum.totalCoins || 0,
        coinsRedeemedThisMonth: totalCoinsRedeemed._sum.coinsUsed || 0,
        totalRemainingCoins: remainingCoinsAgg._sum.remainingCoins || 0,
    };
}

async function getRecentBorrows() {
    return prisma.borrowRecord.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
            items: { include: { book: true } },
        },
    });
}

async function getRecentTransactions() {
    return prisma.coinTransaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            package: { include: { user: true } },
            processedBy: true,
        },
    });
}

export default async function DashboardPage() {
    const t = await getTranslations("AdminDashboard");
    const [stats, recentBorrows, recentTransactions] = await Promise.all([
        getDashboardStats(),
        getRecentBorrows(),
        getRecentTransactions(),
    ]);

    const statCards = [
        {
            label: t("stats.totalMembers"),
            value: stats.totalMembers,
            sub: `${stats.totalChildren} ${t("stats.totalChildren")}`,
            icon: Users,
            color: "green",
        },
        {
            label: t("stats.activePackages"),
            value: stats.activePackages,
            sub: t("stats.packagesUnit"),
            icon: Coins,
            color: "emerald",
        },
        {
            label: t("stats.borrowedBooks"),
            value: stats.borrowedBooks,
            sub: t("stats.itemsUnit"),
            icon: BookOpen,
            color: "amber",
        },
        {
            label: t("stats.expiringPackages"),
            value: stats.expiringPackages,
            sub: t("stats.within7Days"),
            icon: AlertTriangle,
            color: "red",
        },
        {
            label: t("stats.coinsPurchased"),
            value: stats.coinsPurchasedThisMonth,
            sub: t("stats.coinsUnit"),
            icon: TrendingUp,
            color: "blue",
        },
        {
            label: t("stats.coinsRedeemed"),
            value: stats.coinsRedeemedThisMonth,
            sub: t("stats.coinsUnit"),
            icon: TrendingDown,
            color: "purple",
        },
        {
            label: t("stats.remainingCoins"),
            value: stats.totalRemainingCoins,
            sub: t("stats.coinsUnit"),
            icon: Coins,
            color: "teal",
        },
    ];

    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
        green: { bg: "bg-[#81b29a]/10", text: "text-[#609279]", icon: "text-[#609279]" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
        red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
        blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
        teal: { bg: "bg-teal-50", text: "text-teal-600", icon: "text-teal-500" },
    };



    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">{t("title")}</h1>
                <p className="text-[#3d405b]/50 mt-1">{t("subtitle")}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card) => {
                    const colors = colorMap[card.color];
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-[#3d405b]/50 font-medium">{card.label}</p>
                                    <p className={`text-3xl font-bold ${colors.text} mt-2`}>
                                        {card.value}
                                    </p>
                                    <p className="text-xs text-[#3d405b]/40 mt-1">{card.sub}</p>
                                </div>
                                <div className={`${colors.bg} p-3 rounded-xl`}>
                                    <Icon size={22} className={colors.icon} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Borrows */}
                <Card padding={false}>
                    <div className="p-6 border-b border-[#d1cce7]/20">
                        <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                            <BookOpen size={18} className="text-[#609279]" />
                            {t("recentBorrows.title")}
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {recentBorrows.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                {t("recentBorrows.empty")}
                            </div>
                        ) : (
                            recentBorrows.map((b) => {
                                return (
                                    <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[#3d405b]/80">{b.user.parentName}</p>
                                            <p className="text-xs text-[#3d405b]/40">{b.code} · {b.items.length} {t("recentBorrows.booksUnit")}</p>
                                        </div>
                                        <StatusBadge status={b.status} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Recent Transactions */}
                <Card padding={false}>
                    <div className="p-6 border-b border-[#d1cce7]/20">
                        <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                            <Coins size={18} className="text-emerald-500" />
                            {t("recentTransactions.title")}
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {recentTransactions.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                {t("recentTransactions.empty")}
                            </div>
                        ) : (
                            recentTransactions.map((tx) => (
                                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#3d405b]/80">
                                            {tx.package.user.parentName}
                                        </p>
                                        <p className="text-xs text-[#3d405b]/40">
                                            {COIN_TX_TYPE_MAP[tx.type] || tx.type}
                                            {tx.className ? ` · ${tx.className}` : ""}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-red-500">
                                        -{tx.coinsUsed} {t("stats.coinsUnit")}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
