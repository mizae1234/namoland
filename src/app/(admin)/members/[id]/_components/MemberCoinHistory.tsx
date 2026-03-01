"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";

type Transaction = {
    id: string;
    type: string;
    coinsUsed: number;
    className: string | null;
    createdAt: string | Date;
};

type Package = {
    id: string;
    packageType: string;
    totalCoins: number;
    remainingCoins: number;
    pricePaid: number | string;
    bonusAmount: number | string;
    isExpired: boolean;
    expiresAt: string | Date | null;
    createdAt: string | Date;
    transactions: Transaction[];
};

type HistoryRow = {
    date: Date;
    month: string;
    label: string;
    className: string | null;
    amount: number;
    coinPurchase: number;
    coinUsage: number;
    balance: number;
    validUntil: string | null;
    isExpired: boolean;
    isPurchase: boolean;
};

const TX_TYPE_MAP: Record<string, string> = {
    CLASS_FEE: "ค่าเรียน",
    BOOK_RENTAL: "ค่ายืมหนังสือ",
    BOOK_DEPOSIT: "เงินมัดจำ",
    BOOK_DEPOSIT_RETURN: "คืนมัดจำ",
    BOOK_LATE_FEE: "ค่าปรับช้า",
    BOOK_DAMAGE_FEE: "ค่าปรับเสียหาย",
    DEPOSIT_FORFEIT: "ยึดมัดจำ",
    EXPIRED: "หมดอายุ",
    ADJUSTMENT: "ปรับเหรียญ",
    EXTENSION: "ขยายเวลา",
};

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MemberCoinHistory({ packages }: { packages: Package[] }) {
    // Build all events: purchases + transactions
    const rows: HistoryRow[] = [];

    // Add package purchases
    for (const pkg of packages) {
        rows.push({
            date: new Date(pkg.createdAt),
            month: MONTH_NAMES[new Date(pkg.createdAt).getMonth()],
            label: `ซื้อแพ็คเกจ ${pkg.packageType.replace("_", " ")}`,
            className: null,
            amount: Number(pkg.pricePaid),
            coinPurchase: pkg.totalCoins,
            coinUsage: 0,
            balance: 0, // will compute after sorting
            validUntil: pkg.expiresAt
                ? format(new Date(pkg.expiresAt), "d-MMM-yy", { locale: th })
                : null,
            isExpired: false,
            isPurchase: true,
        });

        // Add transactions for this package
        for (const tx of pkg.transactions) {
            rows.push({
                date: new Date(tx.createdAt),
                month: MONTH_NAMES[new Date(tx.createdAt).getMonth()],
                label: TX_TYPE_MAP[tx.type] || tx.type,
                className: tx.className || null,
                amount: tx.type === "CLASS_FEE" ? -(Number(pkg.pricePaid) / pkg.totalCoins * tx.coinsUsed) : 0,
                coinPurchase: 0,
                coinUsage: tx.coinsUsed,
                balance: 0,
                validUntil: pkg.expiresAt
                    ? format(new Date(pkg.expiresAt), "d-MMM-yy", { locale: th })
                    : null,
                isExpired: tx.type === "EXPIRED",
                isPurchase: false,
            });
        }
    }

    // Sort by date ascending
    rows.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Compute running balance
    let balance = 0;
    for (const row of rows) {
        balance = balance + row.coinPurchase - row.coinUsage;
        row.balance = balance;
    }

    // Compute monthly end balances
    const monthlyBalances: Record<string, number> = {};
    for (const row of rows) {
        const key = `${row.date.getFullYear()}-${row.date.getMonth()}`;
        monthlyBalances[key] = row.balance;
    }

    // Get unique months for sidebar
    const uniqueMonths = Object.entries(monthlyBalances).map(([key, bal]) => {
        const [year, month] = key.split("-").map(Number);
        return { year, month, balance: bal, label: MONTH_NAMES[month] };
    });
    uniqueMonths.sort((a, b) => a.year - b.year || a.month - b.month);

    if (rows.length === 0) {
        return (
            <div className="p-6 text-center text-slate-400 text-sm">
                ยังไม่มีประวัติเหรียญ
            </div>
        );
    }

    return (
        <div className="flex gap-6">
            {/* Main Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2.5 font-semibold text-slate-600">วันที่</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-slate-600">เดือน</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-slate-600">รายการ / คลาส</th>
                            <th className="text-right px-3 py-2.5 font-semibold text-slate-600">จำนวนเงิน</th>
                            <th className="text-center px-3 py-2.5 font-semibold text-slate-600" colSpan={2}>
                                <div className="flex">
                                    <span className="flex-1 text-center">ซื้อ</span>
                                    <span className="flex-1 text-center">ใช้</span>
                                </div>
                            </th>
                            <th className="text-right px-3 py-2.5 font-semibold text-slate-600">คงเหลือ</th>
                            <th className="text-right px-3 py-2.5 font-semibold text-slate-600">ใช้ได้ถึง</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={i}
                                className={`border-b border-slate-50 ${row.isExpired
                                        ? "bg-red-50 text-red-700"
                                        : row.isPurchase
                                            ? "bg-blue-50/40"
                                            : "hover:bg-slate-50/50"
                                    }`}
                            >
                                <td className="px-3 py-2.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                                    {format(row.date, "d-MMM-yy", { locale: th })}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 text-xs">
                                    {row.month}
                                </td>
                                <td className="px-3 py-2.5">
                                    <span className={`text-xs ${row.isExpired ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                                        {row.label}
                                    </span>
                                    {row.className && (
                                        <span className="ml-2 text-xs text-slate-400">
                                            {row.className}
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-xs">
                                    {row.amount !== 0 ? (
                                        <span className={row.amount > 0 ? "text-slate-700" : "text-red-500"}>
                                            {row.amount > 0 ? "" : "("}
                                            {Math.abs(row.amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            {row.amount > 0 ? "" : ")"}
                                        </span>
                                    ) : ""}
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono text-xs text-blue-600 font-medium w-[60px]">
                                    {row.coinPurchase > 0 ? row.coinPurchase : ""}
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono text-xs text-red-500 w-[60px]">
                                    {row.coinUsage > 0 ? row.coinUsage : ""}
                                </td>
                                <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${row.balance === 0 && row.isExpired ? "text-red-600" : "text-slate-800"
                                    }`}>
                                    {row.balance}
                                </td>
                                <td className="px-3 py-2.5 text-right text-xs text-slate-400 whitespace-nowrap">
                                    {row.validUntil || ""}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Monthly Balance Sidebar */}
            {uniqueMonths.length > 0 && (
                <div className="w-[160px] shrink-0">
                    <div className="bg-slate-50 rounded-xl p-3 sticky top-4">
                        <h4 className="text-xs font-semibold text-slate-500 mb-2">
                            Balance at month end
                        </h4>
                        <div className="space-y-1">
                            {uniqueMonths.map((m, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between text-xs"
                                >
                                    <span className="text-slate-500">{m.label}</span>
                                    <span className={`font-mono font-medium ${m.balance === 0 ? "text-red-500" : "text-slate-800"}`}>
                                        {m.balance}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
