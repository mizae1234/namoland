import { getOwnerDashboardData } from "@/actions/dashboard";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    BookOpen,
    AlertTriangle,
    Coins,
    Users,
    Crown,
    UserX,
    BookX,
    Clock,
    Flame,
    BarChart3,
    Wallet,
    Banknote,
} from "lucide-react";
import RevenueChart from "./_components/RevenueChart";
import Card from "@/components/ui/Card";
import { getTranslations, getLocale } from "next-intl/server";

function formatMoney(n: number) {
    return n.toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "2-digit",
    });
}

export default async function DashboardPage() {
    const t = await getTranslations("AdminOwner");
    const localeStr = await getLocale();
    const isThai = localeStr === "th";

    const data = await getOwnerDashboardData();
    const { kpi, alerts, topBooks, customerInsights, financial } = data;

    const totalAlerts =
        alerts.overdueMoreThan3Days.length +
        alerts.expiringPackages.length +
        alerts.deadStockBooks.length +
        alerts.lowCoinUsers.length;

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">
                    {t("title")}
                </h1>
                <p className="text-[#3d405b]/50 mt-1">
                    {t("subtitlePrefix")} ·{" "}
                    {new Date().toLocaleDateString(isThai ? "th-TH" : "en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>

            {/* ─── 1. KPI Cards ───────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {/* Today Revenue + Cash */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-emerald-50 p-2 rounded-lg">
                            <DollarSign size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.todayRevenue")}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        ฿{formatMoney(kpi.todayRevenue)}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        {t("kpi.yesterdayRevenue")} ฿{formatMoney(kpi.yesterdayRevenue)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Banknote size={12} className="text-blue-500" />
                            <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.todayCash")}</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                            ฿{formatMoney(kpi.todayCash)}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            {t("kpi.yesterdayCash")} ฿{formatMoney(kpi.yesterdayCash)}
                        </p>
                    </div>
                </div>

                {/* Month Revenue + Cash */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-[#81b29a]/10 p-2 rounded-lg">
                            <BarChart3 size={16} className="text-[#609279]" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.thisMonthRevenue")}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        ฿{formatMoney(kpi.thisMonthRevenue)}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        {t("kpi.lastMonthRevenue")} ฿{formatMoney(kpi.lastMonthRevenue)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Banknote size={12} className="text-blue-500" />
                            <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.thisMonthCash")}</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                            ฿{formatMoney(kpi.thisMonthCash)}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            {t("kpi.lastMonthCash")} ฿{formatMoney(kpi.lastMonthCash)}
                        </p>
                    </div>
                </div>

                {/* Revenue Change */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${kpi.revenueChangePercent >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                            {kpi.revenueChangePercent >= 0
                                ? <TrendingUp size={16} className="text-emerald-500" />
                                : <TrendingDown size={16} className="text-red-500" />
                            }
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.compareYesterday")}</span>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.revenueChangePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {kpi.revenueChangePercent >= 0 ? "+" : ""}{kpi.revenueChangePercent}%
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        {t("kpi.change")}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            {kpi.monthlyRevenueChangePercent >= 0
                                ? <TrendingUp size={12} className="text-emerald-500" />
                                : <TrendingDown size={12} className="text-red-500" />
                            }
                            <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.compareLastMonth")}</span>
                        </div>
                        <p className={`text-lg font-bold ${kpi.monthlyRevenueChangePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {kpi.monthlyRevenueChangePercent >= 0 ? "+" : ""}{kpi.monthlyRevenueChangePercent}%
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            {t("kpi.change")}
                        </p>
                    </div>
                </div>

                {/* Books Rented */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-amber-50 p-2 rounded-lg">
                            <BookOpen size={16} className="text-amber-500" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.borrowing")}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        {kpi.borrowedCount}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">{t("kpi.booksUnit")}</p>
                </div>

                {/* Overdue */}
                <div className={`rounded-2xl p-5 border shadow-sm ${kpi.overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-[#d1cce7]/20"}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${kpi.overdueCount > 0 ? "bg-red-100" : "bg-[#f4f1de]/50"}`}>
                            <AlertTriangle size={16} className={kpi.overdueCount > 0 ? "text-red-500" : "text-[#3d405b]/40"} />
                        </div>
                        <span className={`text-xs font-medium ${kpi.overdueCount > 0 ? "text-red-500" : "text-[#3d405b]/40"}`}>
                            {t("kpi.overdue")}
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.overdueCount > 0 ? "text-red-600" : "text-[#3d405b]"}`}>
                        {kpi.overdueCount}
                    </p>
                    <p className={`text-xs mt-1 ${kpi.overdueCount > 0 ? "text-red-400" : "text-[#3d405b]/40"}`}>
                        {t("kpi.itemsUnit")}
                    </p>
                </div>

                {/* Coin Balance */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-violet-50 p-2 rounded-lg">
                            <Coins size={16} className="text-violet-500" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">{t("kpi.systemCoins")}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        {kpi.totalRemainingCoins.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">{t("kpi.remainingCoins")}</p>
                </div>
            </div>

            {/* ─── 2. Revenue Chart ──────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20 shadow-sm mb-8">
                <RevenueChart data={data.revenueTrend} />
            </div>

            {/* ─── 3. Business Alerts ────────────────────── */}
            {totalAlerts > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-red-50 rounded-2xl p-6 border border-amber-200 mb-8">
                    <h2 className="font-semibold text-[#3d405b] text-lg flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-amber-500" />
                        {t("alerts.title")} ({totalAlerts} {t("alerts.items")})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Overdue > 3 days */}
                        {alerts.overdueMoreThan3Days.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-red-200">
                                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-3">
                                    <Clock size={14} />
                                    {t("alerts.overdue")} ({alerts.overdueMoreThan3Days.length})
                                </h3>
                                <div className="space-y-2">
                                    {alerts.overdueMoreThan3Days.map((r) => (
                                        <div key={r.code} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium text-[#3d405b]/80">{r.parentName}</p>
                                                <p className="text-xs text-[#3d405b]/40">{r.books.join(", ")}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                                {r.daysPast} {t("alerts.daysUnit")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expiring packages */}
                        {alerts.expiringPackages.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-amber-200">
                                <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
                                    <Coins size={14} />
                                    {t("alerts.expiringCoins")} ({alerts.expiringPackages.length})
                                </h3>
                                <div className="space-y-2">
                                    {alerts.expiringPackages.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-[#3d405b]/80">{p.userName}</span>
                                            <span className="text-xs text-amber-600">
                                                {p.remainingCoins} {t("alerts.coinsUnit")} · {t("alerts.expiresOn")} {formatDate(p.expiresAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dead stock */}
                        {alerts.deadStockBooks.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-[#d1cce7]/30">
                                <h3 className="text-sm font-semibold text-[#3d405b]/80 flex items-center gap-1.5 mb-3">
                                    <BookX size={14} />
                                    {t("alerts.deadStock")} ({alerts.deadStockBooks.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {alerts.deadStockBooks.slice(0, 5).map((b, i) => (
                                        <div key={i} className="text-sm text-[#3d405b]/70 flex justify-between">
                                            <span>{b.title}</span>
                                            <span className="text-xs text-[#3d405b]/40">{b.category}</span>
                                        </div>
                                    ))}
                                    {alerts.deadStockBooks.length > 5 && (
                                        <p className="text-xs text-[#3d405b]/40">
                                            +{alerts.deadStockBooks.length - 5} {t("alerts.moreBooks")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Low coin users */}
                        {alerts.lowCoinUsers.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-[#d1cce7]/30">
                                <h3 className="text-sm font-semibold text-[#3d405b]/80 flex items-center gap-1.5 mb-3">
                                    <Wallet size={14} />
                                    {t("alerts.lowCoinUsers")} ({alerts.lowCoinUsers.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {alerts.lowCoinUsers.slice(0, 5).map((u, i) => (
                                        <div key={i} className="text-sm text-[#3d405b]/70 flex justify-between">
                                            <span>{u.userName}</span>
                                            <span className="text-xs text-amber-600 font-medium">
                                                {u.remainingCoins} {t("alerts.coinsUnit")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── 4. Top Performance (2 columns) ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top 5 Books */}
                <Card padding={false} className="overflow-hidden">
                    <div className="p-5 border-b border-[#d1cce7]/20">
                        <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                            <Flame size={18} className="text-orange-500" />
                            {t("topPerformance.topBooks")}
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {topBooks.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                {t("topPerformance.emptyBorrows")}
                            </div>
                        ) : (
                            topBooks.map((book, i) => (
                                <div key={i} className="px-5 py-4 flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0
                                        ? "bg-amber-100 text-amber-700"
                                        : i === 1
                                            ? "bg-[#d1cce7]/25 text-[#3d405b]/70"
                                            : i === 2
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-[#d1cce7]/15 text-[#3d405b]/50"
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#3d405b]/80">{book.title}</p>
                                        <p className="text-xs text-[#3d405b]/40">
                                            {t("topPerformance.borrowedCount")} {book.count} {t("topPerformance.timesUnit")} · {t("topPerformance.fee")} {book.coins} {t("alerts.coinsUnit")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Dead Stock */}
                <Card padding={false} className="overflow-hidden">
                    <div className="p-5 border-b border-[#d1cce7]/20">
                        <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                            <BookX size={18} className="text-[#3d405b]/40" />
                            {t("topPerformance.deadStock")}
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {alerts.deadStockBooks.length === 0 ? (
                            <div className="p-6 text-center text-emerald-500 text-sm">
                                {t("topPerformance.allBorrowed")}
                            </div>
                        ) : (
                            alerts.deadStockBooks.slice(0, 8).map((book, i) => (
                                <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#3d405b]/80">{book.title}</p>
                                        <p className="text-xs text-[#3d405b]/40 font-mono">{book.qrCode}</p>
                                    </div>
                                    {book.category && (
                                        <span className="text-xs bg-[#d1cce7]/15 text-[#3d405b]/50 px-2.5 py-1 rounded-full">
                                            {book.category}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* ─── 5. Customer Insights ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* New members */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-[#609279]" />
                        <h3 className="font-semibold text-[#3d405b]">{t("customerInsights.newMembers")}</h3>
                    </div>
                    <p className="text-4xl font-bold text-[#609279]">
                        {customerInsights.newMembersThisMonth}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">{t("customerInsights.peopleUnit")}</p>
                </div>

                {/* Top spenders */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown size={18} className="text-amber-500" />
                        <h3 className="font-semibold text-[#3d405b]">{t("customerInsights.topSpenders")}</h3>
                    </div>
                    <div className="space-y-3">
                        {customerInsights.topSpenders.length === 0 ? (
                            <p className="text-sm text-[#3d405b]/40">{t("customerInsights.emptyData")}</p>
                        ) : (
                            customerInsights.topSpenders.map((s, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-[#d1cce7]/15 text-[#3d405b]/50"
                                            }`}>
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-[#3d405b]/80">{s.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-600">
                                        ฿{formatMoney(s.totalSpent)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Inactive members */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <UserX size={18} className="text-red-400" />
                        <h3 className="font-semibold text-[#3d405b]">{t("customerInsights.inactive")}</h3>
                    </div>
                    <p className="text-4xl font-bold text-red-500">
                        {customerInsights.inactiveMembers.length}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">{t("customerInsights.peopleUnit")}</p>
                    {customerInsights.inactiveMembers.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {customerInsights.inactiveMembers.slice(0, 3).map((name, i) => (
                                <p key={i} className="text-xs text-[#3d405b]/50">{name}</p>
                            ))}
                            {customerInsights.inactiveMembers.length > 3 && (
                                <p className="text-xs text-[#3d405b]/40">
                                    +{customerInsights.inactiveMembers.length - 3} {t("alerts.moreUsers")}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 6. Financial Summary ──────────────────── */}
            <Card padding={false} className="overflow-hidden mb-8">
                <div className="p-5 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] text-lg flex items-center gap-2">
                        <Wallet size={18} className="text-emerald-500" />
                        {t("financial.title")}
                    </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#d1cce7]/20">
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">{t("financial.revenueLabel")}</p>
                        <p className="text-xl font-bold text-emerald-600">
                            ฿{formatMoney(financial.thisMonthRevenue)}
                        </p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">{t("financial.lastMonth")}</p>
                        <p className="text-xl font-bold text-[#3d405b]/70">
                            ฿{formatMoney(financial.lastMonthRevenue)}
                        </p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">{t("financial.totalCoinsSold")}</p>
                        <p className="text-xl font-bold text-[#609279]">
                            {financial.coinsPurchased.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">{t("alerts.coinsUnit")}</p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">{t("financial.totalCoinsUsed")}</p>
                        <p className="text-xl font-bold text-amber-600">
                            {financial.coinsRedeemed.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">{t("alerts.coinsUnit")}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
