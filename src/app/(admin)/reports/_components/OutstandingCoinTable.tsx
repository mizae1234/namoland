"use client";

import { useState, useTransition } from "react";
import { OutstandingCoinReport } from "@/actions/report";
import { getOutstandingCoinReport } from "@/actions/report";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";

function fmt(n: number) {
    if (n === 0) return "";
    return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number) {
    if (n === 0) return "";
    return n.toLocaleString();
}

function fmtPct(n: number) {
    if (n === 0) return "";
    return n.toFixed(2);
}

export default function OutstandingCoinTable({
    initialData,
}: {
    initialData: OutstandingCoinReport;
}) {
    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();

    function changeYear(newYear: number) {
        startTransition(async () => {
            const result = await getOutstandingCoinReport(newYear);
            setData(result);
        });
    }

    // Totals
    const totalPurchase = data.months.reduce((s, m) => s + m.purchase, 0);
    const totalUsage = data.months.reduce((s, m) => s + m.usage, 0);
    const totalAdjustUp = data.months.reduce((s, m) => s + m.adjustUp, 0);
    const totalAdjustDown = data.months.reduce((s, m) => s + m.adjustDown, 0);
    const totalAmount = data.months.reduce((s, m) => s + m.amount, 0);
    const totalGross = data.months.reduce((s, m) => s + m.grossAmount, 0);
    const totalDiscount = data.months.reduce((s, m) => s + m.discount, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
        <div>
            {/* Year Selector */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => changeYear(data.year - 1)}
                    disabled={isPending}
                    className="p-2 rounded-lg border border-[#d1cce7]/30 hover:bg-[#f4f1de]/50 transition disabled:opacity-50"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-lg font-bold text-[#3d405b] min-w-[60px] text-center">
                    {data.year}
                </span>
                <button
                    onClick={() => changeYear(data.year + 1)}
                    disabled={isPending}
                    className="p-2 rounded-lg border border-[#d1cce7]/30 hover:bg-[#f4f1de]/50 transition disabled:opacity-50"
                >
                    <ChevronRight size={18} />
                </button>
                {isPending && (
                    <span className="text-xs text-[#3d405b]/40 ml-2">กำลังโหลด...</span>
                )}
            </div>

            {/* Table */}
            <Card padding={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70 w-[100px]">
                                    End of Month
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Coin Balance
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Purchase
                                </th>
                                <th className="text-right px-3 py-3 font-semibold text-blue-600/70 text-xs">
                                    Adj +
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Usage
                                </th>
                                <th className="text-right px-3 py-3 font-semibold text-orange-600/70 text-xs">
                                    Adj −
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Balance
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Amount
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Gross
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    Discount
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    % Disc
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* B/F Row */}
                            <tr className="border-b border-[#d1cce7]/20 bg-[#81b29a]/10/50">
                                <td className="px-4 py-3 font-medium text-[#3d405b]/80">B/F</td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b] font-medium">
                                    {fmtInt(data.bfBalance)}
                                </td>
                                <td className="px-4 py-3 text-right text-[#3d405b]/40">0</td>
                                <td className="px-3 py-3 text-right text-[#3d405b]/40">0</td>
                                <td className="px-4 py-3 text-right text-[#3d405b]/40">0</td>
                                <td className="px-3 py-3 text-right text-[#3d405b]/40">0</td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b] font-medium">
                                    {fmtInt(data.bfBalance)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]/80">
                                    {fmt(data.bfAmount)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]/80">
                                    {fmt(data.bfGrossAmount)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]/80">
                                    {fmt(data.bfDiscount)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]/50">
                                    {fmtPct(data.bfDiscountPercent)}
                                </td>
                            </tr>

                            {/* Monthly Rows */}
                            {data.months.map((m) => {
                                const isCurrentMonth =
                                    data.year === currentYear && m.monthIndex === currentMonth;
                                const isPastMonth =
                                    data.year < currentYear ||
                                    (data.year === currentYear && m.monthIndex < currentMonth);
                                const isFutureMonth =
                                    data.year > currentYear ||
                                    (data.year === currentYear && m.monthIndex > currentMonth);

                                return (
                                    <tr
                                        key={m.month}
                                        className={`border-b border-[#d1cce7]/15 transition-colors ${isCurrentMonth
                                            ? "bg-emerald-50/50 font-medium"
                                            : isFutureMonth
                                                ? "text-[#3d405b]/30"
                                                : "hover:bg-[#f4f1de]/50/50"
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <span className={`font-medium ${isCurrentMonth ? "text-emerald-700" : isPastMonth ? "text-[#3d405b]/80" : "text-[#3d405b]/30"}`}>
                                                {m.month}
                                            </span>
                                            {isCurrentMonth && (
                                                <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                    ปัจจุบัน
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {fmtInt(m.coinBalance) || (isFutureMonth ? "" : "0")}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-[#609279]">
                                            {fmtInt(m.purchase)}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-blue-500 text-xs">
                                            {fmtInt(m.adjustUp)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-red-500">
                                            {fmtInt(m.usage)}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-orange-500 text-xs">
                                            {fmtInt(m.adjustDown)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">
                                            {fmtInt(m.balance) || (isFutureMonth ? "" : "0")}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {fmt(m.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {fmt(m.grossAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {fmt(m.discount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-[#3d405b]/50">
                                            {fmtPct(m.discountPercent)}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Totals Row */}
                            <tr className="bg-[#d1cce7]/15 border-t-2 border-[#d1cce7]/30 font-semibold">
                                <td className="px-4 py-3 text-[#3d405b]/80">รวม</td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmtInt(data.months[11]?.balance || 0)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#609279]">
                                    {fmtInt(totalPurchase)}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-blue-600 text-xs">
                                    {fmtInt(totalAdjustUp)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-red-600">
                                    {fmtInt(totalUsage)}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-orange-600 text-xs">
                                    {fmtInt(totalAdjustDown)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmtInt(data.months[11]?.balance || 0)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmt(totalAmount)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmt(totalGross)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmt(totalDiscount)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]/70">
                                    {totalGross > 0 ? (totalDiscount / totalGross).toFixed(2) : ""}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
