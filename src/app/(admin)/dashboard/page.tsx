import prisma from "@/lib/prisma";
import {
    Users,
    Coins,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { COIN_TX_TYPE_MAP } from "@/lib/constants";

async function getDashboardStats() {
    const [
        totalMembers,
        totalChildren,
        activePackages,
        borrowedBooks,
        expiringPackages,
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
    ]);

    return {
        totalMembers,
        totalChildren,
        activePackages,
        borrowedBooks,
        expiringPackages,
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
    const stats = await getDashboardStats();
    const recentBorrows = await getRecentBorrows();
    const recentTransactions = await getRecentTransactions();

    const statCards = [
        {
            label: "สมาชิกทั้งหมด",
            value: stats.totalMembers,
            sub: `${stats.totalChildren} เด็ก`,
            icon: Users,
            color: "green",
        },
        {
            label: "แพ็คเกจเหรียญ Active",
            value: stats.activePackages,
            sub: "แพ็คเกจ",
            icon: Coins,
            color: "emerald",
        },
        {
            label: "หนังสือที่กำลังยืม",
            value: stats.borrowedBooks,
            sub: "รายการ",
            icon: BookOpen,
            color: "amber",
        },
        {
            label: "เหรียญใกล้หมดอายุ",
            value: stats.expiringPackages,
            sub: "ภายใน 7 วัน",
            icon: AlertTriangle,
            color: "red",
        },
    ];

    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
        green: { bg: "bg-[#81b29a]/10", text: "text-[#609279]", icon: "text-[#609279]" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
        red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
    };



    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">Admin Dashboard</h1>
                <p className="text-[#3d405b]/50 mt-1">ภาพรวมระบบ Namoland</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                            รายการยืมล่าสุด
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {recentBorrows.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                ยังไม่มีรายการยืม
                            </div>
                        ) : (
                            recentBorrows.map((b) => {
                                return (
                                    <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[#3d405b]/80">{b.user.parentName}</p>
                                            <p className="text-xs text-[#3d405b]/40">{b.code} · {b.items.length} เล่ม</p>
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
                            ธุรกรรมเหรียญล่าสุด
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {recentTransactions.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                ยังไม่มีธุรกรรมเหรียญ
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
                                        -{tx.coinsUsed} เหรียญ
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
