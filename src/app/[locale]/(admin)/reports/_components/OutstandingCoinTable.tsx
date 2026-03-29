"use client";

import { useState, useTransition } from "react";
import { OutstandingCoinReport } from "@/actions/report";
import { getOutstandingCoinReport } from "@/actions/report";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import * as XLSX from "xlsx";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("AdminReports.outstandingCoin");
    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();

    function changeYear(newYear: number) {
        startTransition(async () => {
            const result = await getOutstandingCoinReport(newYear);
            setData(result);
        });
    }

    // Totals (coin columns: sum of monthly flows, money columns: last month's cumulative value)
    const totalPurchase = data.months.reduce((s, m) => s + m.purchase, 0);
    const totalUsage = data.months.reduce((s, m) => s + m.usage, 0);
    const totalAdjustUp = data.months.reduce((s, m) => s + m.adjustUp, 0);
    const totalAdjustDown = data.months.reduce((s, m) => s + m.adjustDown, 0);

    // Amount/Gross/Discount are now cumulative running balances — use the last month value
    const lastMonth = data.months[data.months.length - 1];
    const totalAmount = lastMonth?.amount || 0;
    const totalGross = lastMonth?.grossAmount || 0;
    const totalDiscount = lastMonth?.discount || 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    function exportToExcel() {
        const rows = [];

        // Header explanation
        rows.push({
            "End of Month": `Outstanding Coin Report ${data.year}`,
            "Coin Balance": "",
            "Purchase": "",
            "Adj +": "",
            "Usage": "",
            "Adj −": "",
            "Balance": "",
            "Amount": "",
            "Gross": "",
            "Discount": "",
            "% Disc": "",
        });

        // B/F row
        rows.push({
            "End of Month": "B/F",
            "Coin Balance": data.bfBalance || "",
            "Purchase": 0,
            "Adj +": 0,
            "Usage": 0,
            "Adj −": 0,
            "Balance": data.bfBalance || "",
            "Amount": data.bfAmount || "",
            "Gross": data.bfGrossAmount || "",
            "Discount": data.bfDiscount || "",
            "% Disc": data.bfDiscountPercent || "",
        });

        // Month rows
        for (const m of data.months) {
            rows.push({
                "End of Month": m.month,
                "Coin Balance": m.coinBalance || "",
                "Purchase": m.purchase || "",
                "Adj +": m.adjustUp || "",
                "Usage": m.usage || "",
                "Adj −": m.adjustDown || "",
                "Balance": m.balance || "",
                "Amount": m.amount || "",
                "Gross": m.grossAmount || "",
                "Discount": m.discount || "",
                "% Disc": m.discountPercent || "",
            });
        }

        // Total row
        rows.push({
            "End of Month": t("table.total"),
            "Coin Balance": lastMonth?.balance || 0,
            "Purchase": totalPurchase,
            "Adj +": totalAdjustUp || "",
            "Usage": totalUsage,
            "Adj −": totalAdjustDown || "",
            "Balance": lastMonth?.balance || 0,
            "Amount": totalAmount,
            "Gross": totalGross,
            "Discount": totalDiscount,
            "% Disc": totalGross > 0 ? totalDiscount / totalGross : "",
        });

        const ws = XLSX.utils.json_to_sheet(rows);

        // Set column widths
        ws["!cols"] = [
            { wch: 14 }, // End of Month
            { wch: 12 }, // Coin Balance
            { wch: 10 }, // Purchase
            { wch: 8 },  // Adj +
            { wch: 10 }, // Usage
            { wch: 8 },  // Adj -
            { wch: 10 }, // Balance
            { wch: 14 }, // Amount
            { wch: 14 }, // Gross
            { wch: 14 }, // Discount
            { wch: 8 },  // % Disc
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Outstanding ${data.year}`);
        XLSX.writeFile(wb, `outstanding_coin_${data.year}.xlsx`);
    }

    return (
        <div>
            {/* Year Selector + Export */}
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
                    <span className="text-xs text-[#3d405b]/40 ml-2">{t("loading")}</span>
                )}

                <div className="ml-auto">
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-lg text-sm font-medium hover:bg-[#4e7a63] transition-colors"
                    >
                        <Download size={14} />
                        {t("exportBtn")}
                    </button>
                </div>
            </div>

            {/* Table */}
            <Card padding={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70 w-[100px]">
                                    {t("table.endOfMonth")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.coinBalance")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.purchase")}
                                </th>
                                <th className="text-right px-3 py-3 font-semibold text-blue-600/70 text-xs">
                                    {t("table.adjUp")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.usage")}
                                </th>
                                <th className="text-right px-3 py-3 font-semibold text-orange-600/70 text-xs">
                                    {t("table.adjDown")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.balance")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.amount")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.gross")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.discount")}
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">
                                    {t("table.pctDisc")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* B/F Row */}
                            <tr className="border-b border-[#d1cce7]/20 bg-[#81b29a]/10/50">
                                <td className="px-4 py-3 font-medium text-[#3d405b]/80">{t("table.bf")}</td>
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
                                                    {t("table.current")}
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
                                <td className="px-4 py-3 text-[#3d405b]/80">{t("table.total")}</td>
                                <td className="px-4 py-3 text-right font-mono text-[#3d405b]">
                                    {fmtInt(lastMonth?.balance || 0)}
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
                                    {fmtInt(lastMonth?.balance || 0)}
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
