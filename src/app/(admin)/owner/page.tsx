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
                    Owner Dashboard
                </h1>
                <p className="text-[#3d405b]/50 mt-1">
                    ภาพรวมธุรกิจ Namoland ·{" "}
                    {new Date().toLocaleDateString("th-TH", {
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
                        <span className="text-xs text-[#3d405b]/40 font-medium">รายได้วันนี้</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        ฿{formatMoney(kpi.todayRevenue)}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        เมื่อวาน ฿{formatMoney(kpi.yesterdayRevenue)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Banknote size={12} className="text-blue-500" />
                            <span className="text-xs text-[#3d405b]/40 font-medium">เงินรับวันนี้</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                            ฿{formatMoney(kpi.todayCash)}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            เมื่อวาน ฿{formatMoney(kpi.yesterdayCash)}
                        </p>
                    </div>
                </div>

                {/* Month Revenue + Cash */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-[#81b29a]/10 p-2 rounded-lg">
                            <BarChart3 size={16} className="text-[#609279]" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">รายได้เดือนนี้</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        ฿{formatMoney(kpi.thisMonthRevenue)}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        เดือนก่อน ฿{formatMoney(kpi.lastMonthRevenue)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Banknote size={12} className="text-blue-500" />
                            <span className="text-xs text-[#3d405b]/40 font-medium">เงินรับเดือนนี้</span>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                            ฿{formatMoney(kpi.thisMonthCash)}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            เดือนก่อน ฿{formatMoney(kpi.lastMonthCash)}
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
                        <span className="text-xs text-[#3d405b]/40 font-medium">เทียบเมื่อวาน</span>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.revenueChangePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {kpi.revenueChangePercent >= 0 ? "+" : ""}{kpi.revenueChangePercent}%
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">
                        การเปลี่ยนแปลง
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-1.5 mb-1">
                            {kpi.monthlyRevenueChangePercent >= 0
                                ? <TrendingUp size={12} className="text-emerald-500" />
                                : <TrendingDown size={12} className="text-red-500" />
                            }
                            <span className="text-xs text-[#3d405b]/40 font-medium">เทียบเดือนก่อน</span>
                        </div>
                        <p className={`text-lg font-bold ${kpi.monthlyRevenueChangePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {kpi.monthlyRevenueChangePercent >= 0 ? "+" : ""}{kpi.monthlyRevenueChangePercent}%
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            การเปลี่ยนแปลง
                        </p>
                    </div>
                </div>

                {/* Books Rented */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-amber-50 p-2 rounded-lg">
                            <BookOpen size={16} className="text-amber-500" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">กำลังถูกยืม</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        {kpi.borrowedCount}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">เล่ม</p>
                </div>

                {/* Overdue */}
                <div className={`rounded-2xl p-5 border shadow-sm ${kpi.overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-[#d1cce7]/20"}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${kpi.overdueCount > 0 ? "bg-red-100" : "bg-[#f4f1de]/50"}`}>
                            <AlertTriangle size={16} className={kpi.overdueCount > 0 ? "text-red-500" : "text-[#3d405b]/40"} />
                        </div>
                        <span className={`text-xs font-medium ${kpi.overdueCount > 0 ? "text-red-500" : "text-[#3d405b]/40"}`}>
                            เกินกำหนดคืน
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.overdueCount > 0 ? "text-red-600" : "text-[#3d405b]"}`}>
                        {kpi.overdueCount}
                    </p>
                    <p className={`text-xs mt-1 ${kpi.overdueCount > 0 ? "text-red-400" : "text-[#3d405b]/40"}`}>
                        รายการ
                    </p>
                </div>

                {/* Coin Balance */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-violet-50 p-2 rounded-lg">
                            <Coins size={16} className="text-violet-500" />
                        </div>
                        <span className="text-xs text-[#3d405b]/40 font-medium">เหรียญในระบบ</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">
                        {kpi.totalRemainingCoins.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">เหรียญคงเหลือ</p>
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
                        ⚠️ สิ่งที่ต้องดูแล ({totalAlerts} รายการ)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Overdue > 3 days */}
                        {alerts.overdueMoreThan3Days.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-red-200">
                                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-3">
                                    <Clock size={14} />
                                    ค้างคืนเกิน 3 วัน ({alerts.overdueMoreThan3Days.length})
                                </h3>
                                <div className="space-y-2">
                                    {alerts.overdueMoreThan3Days.map((r) => (
                                        <div key={r.code} className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-medium text-[#3d405b]/80">{r.parentName}</p>
                                                <p className="text-xs text-[#3d405b]/40">{r.books.join(", ")}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                                {r.daysPast} วัน
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
                                    เหรียญใกล้หมดอายุ ({alerts.expiringPackages.length})
                                </h3>
                                <div className="space-y-2">
                                    {alerts.expiringPackages.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-[#3d405b]/80">{p.userName}</span>
                                            <span className="text-xs text-amber-600">
                                                {p.remainingCoins} เหรียญ · หมด {formatDate(p.expiresAt)}
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
                                    หนังสือไม่มีคนยืม 30+ วัน ({alerts.deadStockBooks.length})
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
                                            +{alerts.deadStockBooks.length - 5} เล่ม
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
                                    สมาชิกเหรียญเหลือน้อย ({alerts.lowCoinUsers.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {alerts.lowCoinUsers.slice(0, 5).map((u, i) => (
                                        <div key={i} className="text-sm text-[#3d405b]/70 flex justify-between">
                                            <span>{u.userName}</span>
                                            <span className="text-xs text-amber-600 font-medium">
                                                {u.remainingCoins} เหรียญ
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
                            🔥 Top 5 หนังสือยอดนิยม
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {topBooks.length === 0 ? (
                            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                                ยังไม่มีข้อมูลการยืม
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
                                            ยืม {book.count} ครั้ง · ค่ายืม {book.coins} เหรียญ
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
                            📉 หนังสือไม่มีคนยืม 30+ วัน
                        </h2>
                    </div>
                    <div className="divide-y divide-[#d1cce7]/15">
                        {alerts.deadStockBooks.length === 0 ? (
                            <div className="p-6 text-center text-emerald-500 text-sm">
                                ✅ ทุกเล่มมีคนยืมในช่วง 30 วัน
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
                        <h3 className="font-semibold text-[#3d405b]">สมาชิกใหม่เดือนนี้</h3>
                    </div>
                    <p className="text-4xl font-bold text-[#609279]">
                        {customerInsights.newMembersThisMonth}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">คน</p>
                </div>

                {/* Top spenders */}
                <div className="bg-white rounded-2xl p-5 border border-[#d1cce7]/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Crown size={18} className="text-amber-500" />
                        <h3 className="font-semibold text-[#3d405b]">ลูกค้าใช้จ่ายสูงสุด</h3>
                    </div>
                    <div className="space-y-3">
                        {customerInsights.topSpenders.length === 0 ? (
                            <p className="text-sm text-[#3d405b]/40">ยังไม่มีข้อมูล</p>
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
                        <h3 className="font-semibold text-[#3d405b]">ไม่มีกิจกรรม 60+ วัน</h3>
                    </div>
                    <p className="text-4xl font-bold text-red-500">
                        {customerInsights.inactiveMembers.length}
                    </p>
                    <p className="text-xs text-[#3d405b]/40 mt-1">คน</p>
                    {customerInsights.inactiveMembers.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {customerInsights.inactiveMembers.slice(0, 3).map((name, i) => (
                                <p key={i} className="text-xs text-[#3d405b]/50">{name}</p>
                            ))}
                            {customerInsights.inactiveMembers.length > 3 && (
                                <p className="text-xs text-[#3d405b]/40">
                                    +{customerInsights.inactiveMembers.length - 3} คน
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
                        💰 สรุปการเงินเดือนนี้
                    </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#d1cce7]/20">
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">รายได้ (ขายเหรียญ)</p>
                        <p className="text-xl font-bold text-emerald-600">
                            ฿{formatMoney(financial.thisMonthRevenue)}
                        </p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">เดือนก่อน</p>
                        <p className="text-xl font-bold text-[#3d405b]/70">
                            ฿{formatMoney(financial.lastMonthRevenue)}
                        </p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">เหรียญที่ขายรวม</p>
                        <p className="text-xl font-bold text-[#609279]">
                            {financial.coinsPurchased.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">เหรียญ</p>
                    </div>
                    <div className="p-5">
                        <p className="text-xs text-[#3d405b]/40 font-medium mb-1">เหรียญที่ใช้ไป</p>
                        <p className="text-xl font-bold text-amber-600">
                            {financial.coinsRedeemed.toLocaleString()}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">เหรียญ</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
