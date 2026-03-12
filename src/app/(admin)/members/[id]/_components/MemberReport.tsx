"use client";

import { useState, useTransition } from "react";
import { getMemberReport, MemberReportData } from "@/actions/report";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MemberReport({ userId, memberName }: { userId: string; memberName: string }) {
    const [data, setData] = useState<MemberReportData | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loaded, setLoaded] = useState(false);

    function loadReport() {
        startTransition(async () => {
            const result = await getMemberReport(userId);
            setData(result);
            setLoaded(true);
        });
    }

    function exportToExcel() {
        if (!data || data.rows.length === 0) return;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const XLSX = require("xlsx-js-style");

        const wb = XLSX.utils.book_new();
        const ws: Record<string, unknown> = {};

        // Style definitions
        const borderThin = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        const headerStyle = { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: "D9D9D9" } }, border: borderThin, alignment: { horizontal: "center", vertical: "center" } };
        const normalStyle = { font: { sz: 10 }, border: borderThin };
        const normalRight = { ...normalStyle, alignment: { horizontal: "right" } };
        const normalCenter = { ...normalStyle, alignment: { horizontal: "center" } };
        const redText = { font: { sz: 10, color: { rgb: "FF0000" } }, border: borderThin };
        const redTextRight = { ...redText, alignment: { horizontal: "right" } };
        const redRow = { font: { sz: 10, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "FF0000" } }, border: borderThin };
        const redRowCenter = { ...redRow, alignment: { horizontal: "center" } };
        const greenBorder = { top: { style: "thin", color: { rgb: "008000" } }, bottom: { style: "thin", color: { rgb: "008000" } }, left: { style: "thin", color: { rgb: "008000" } }, right: { style: "thin", color: { rgb: "008000" } } };
        const greenBg = { font: { sz: 10, bold: true }, fill: { fgColor: { rgb: "C6EFCE" } }, border: greenBorder, alignment: { horizontal: "right" } };

        // Row 0: Member name
        ws["A1"] = { v: memberName, s: { font: { bold: true, sz: 12 } } };

        // Row 2 (index 1): empty spacer

        // Row 3 (index 2): Column headers - row 1 of table
        const headers = ["Date", "Month", "Class", "Date/Time", "Amount (฿)", "Coin", "", "Balance", "Valid until"];
        const headerCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
        headers.forEach((h, i) => {
            ws[`${headerCols[i]}3`] = { v: h, s: headerStyle };
        });

        // Row 4 (index 3): Sub-headers for Coin columns
        const subHeaders = ["", "", "", "", "", "Purchase", "Usage", "", ""];
        subHeaders.forEach((h, i) => {
            ws[`${headerCols[i]}4`] = { v: h, s: headerStyle };
        });

        // Merge Coin header (F3:G3)
        ws["!merges"] = [{ s: { r: 2, c: 5 }, e: { r: 2, c: 6 } }];

        // Data rows start at row 5 (index 4)
        data.rows.forEach((row, i) => {
            const r = i + 5; // Excel row (1-indexed)
            const isExpired = row.type === "Expired";
            const style = isExpired ? redRow : normalStyle;
            const styleRight = isExpired ? redRow : normalRight;
            const styleCenter = isExpired ? redRowCenter : normalCenter;

            ws[`A${r}`] = { v: row.date, s: style };
            ws[`B${r}`] = { v: row.month, s: style };
            ws[`C${r}`] = { v: row.type === "Purchase" ? "ซื้อแพ็คเกจ" : row.className, s: style };
            ws[`D${r}`] = { v: row.dateTime, s: style };
            ws[`E${r}`] = row.amount !== 0
                ? { v: row.amount < 0 ? `(${Math.abs(row.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : row.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), s: row.amount < 0 && !isExpired ? redTextRight : styleRight }
                : { v: "", s: style };
            ws[`F${r}`] = row.coinPurchase > 0
                ? { v: row.coinPurchase, s: styleCenter }
                : { v: "", s: style };
            ws[`G${r}`] = row.coinUsage > 0
                ? { v: row.coinUsage, s: isExpired ? redRowCenter : { ...normalCenter, font: { sz: 10 } } }
                : { v: "", s: style };
            ws[`H${r}`] = { v: row.balance, s: styleRight };
            ws[`I${r}`] = { v: row.validUntil, s: style };
        });

        // Monthly balance summary (columns L-N, starting row 2)
        ws["M1"] = { v: "Balance at month end", s: { font: { bold: true, sz: 10 } } };
        ALL_MONTHS.forEach((month, i) => {
            const r = i + 2; // Row 2-13
            const balance = data.monthlyBalance[month];
            ws[`M${r}`] = { v: month, s: { font: { sz: 10 }, border: borderThin } };
            if (balance !== undefined) {
                ws[`N${r}`] = { v: balance, s: greenBg };
            } else {
                ws[`N${r}`] = { v: "-", s: { font: { sz: 10, color: { rgb: "999999" } }, border: borderThin, alignment: { horizontal: "right" } } };
            }
        });

        // Set sheet range
        const lastDataRow = data.rows.length + 4;
        const maxRow = Math.max(lastDataRow, 13);
        ws["!ref"] = `A1:N${maxRow}`;

        // Column widths
        ws["!cols"] = [
            { wch: 12 }, // A: Date
            { wch: 7 },  // B: Month
            { wch: 35 }, // C: Class
            { wch: 22 }, // D: Date/Time
            { wch: 12 }, // E: Amount
            { wch: 10 }, // F: Coin Purchase
            { wch: 10 }, // G: Coin Usage
            { wch: 10 }, // H: Balance
            { wch: 12 }, // I: Valid until
            { wch: 2 },  // J: gap
            { wch: 2 },  // K: gap
            { wch: 2 },  // L: gap
            { wch: 22 }, // M: Balance at month end
            { wch: 8 },  // N: value
        ];

        XLSX.utils.book_append_sheet(wb, ws, memberName.slice(0, 31));
        XLSX.writeFile(wb, `report_${memberName.replace(/\s/g, "_")}.xlsx`);
    }

    // Type-based row styling
    function getRowClass(type: string) {
        if (type === "Expired") return "bg-red-50 text-red-600";
        if (type === "Purchase") return "";
        if (type === "Class") return "";
        if (type.startsWith("Adjust+")) return "bg-blue-50/30";
        if (type.startsWith("Adjust-")) return "bg-amber-50/30";
        return "";
    }

    return (
        <Card padding={false} className="mb-6">
            <div className="p-6 border-b border-[#d1cce7]/20 flex items-center justify-between">
                <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    รายงานสรุป (Excel Format)
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={loadReport}
                        disabled={isPending}
                        className="px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RefreshCw size={14} />
                        )}
                        {loaded ? "รีเฟรช" : "โหลดรายงาน"}
                    </button>
                    {loaded && data && data.rows.length > 0 && (
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-[#3d405b] text-white rounded-xl text-sm font-medium hover:bg-[#2d2f45] transition-colors flex items-center gap-1.5"
                        >
                            <Download size={14} />
                            Export Excel
                        </button>
                    )}
                </div>
            </div>

            {!loaded && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-40" />
                    <p>กดปุ่ม &quot;โหลดรายงาน&quot; เพื่อดูข้อมูล</p>
                </div>
            )}

            {loaded && data && data.rows.length === 0 && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <p>ยังไม่มีข้อมูลเหรียญ</p>
                </div>
            )}

            {loaded && data && data.rows.length > 0 && (
                <div className="flex">
                    {/* Main table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Date</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Month</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Class</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Date/Time</th>
                                    <th className="text-right px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Amount (฿)</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs" colSpan={2}>
                                        Coin
                                    </th>
                                    <th className="text-right px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Balance</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Valid until</th>
                                </tr>
                                <tr className="bg-[#f4f1de]/30 border-b border-[#d1cce7]/20">
                                    <th className="px-3 py-1" colSpan={5}></th>
                                    <th className="text-center px-2 py-1 text-[10px] text-[#3d405b]/50 font-medium">Purchase</th>
                                    <th className="text-center px-2 py-1 text-[10px] text-[#3d405b]/50 font-medium">Usage</th>
                                    <th className="px-3 py-1" colSpan={2}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row, i) => (
                                    <tr
                                        key={i}
                                        className={`border-b border-[#d1cce7]/10 hover:bg-[#f4f1de]/20 transition-colors ${getRowClass(row.type)}`}
                                    >
                                        <td className="px-3 py-2 text-[#3d405b]/70 whitespace-nowrap text-xs">{row.date}</td>
                                        <td className="px-3 py-2 text-[#3d405b]/50 text-xs">{row.month}</td>
                                        <td className="px-3 py-2 text-[#3d405b] font-medium text-xs max-w-[180px] truncate">
                                            {row.type === "Purchase" ? (
                                                <span className="text-emerald-600">ซื้อแพ็คเกจ</span>
                                            ) : row.type === "Expired" ? (
                                                <span className="text-red-500 font-semibold">{row.className}</span>
                                            ) : (
                                                row.className
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-[#3d405b]/50 text-xs whitespace-nowrap">{row.dateTime}</td>
                                        <td className="px-3 py-2 text-right text-xs whitespace-nowrap">
                                            {row.amount !== 0 ? (
                                                <span className={row.amount < 0 ? "text-red-500" : "text-[#3d405b]"}>
                                                    {row.amount < 0 ? `(${Math.abs(row.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})` : row.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                </span>
                                            ) : ""}
                                        </td>
                                        <td className="px-2 py-2 text-center text-xs">
                                            {row.coinPurchase > 0 ? (
                                                <span className="text-emerald-600 font-medium">{row.coinPurchase}</span>
                                            ) : ""}
                                        </td>
                                        <td className="px-2 py-2 text-center text-xs">
                                            {row.coinUsage > 0 ? (
                                                <span className="text-red-500 font-medium">{row.coinUsage}</span>
                                            ) : ""}
                                        </td>
                                        <td className="px-3 py-2 text-right text-xs font-bold text-[#3d405b]">{row.balance}</td>
                                        <td className="px-3 py-2 text-[#3d405b]/50 text-xs whitespace-nowrap">{row.validUntil}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Monthly balance sidebar */}
                    <div className="w-48 border-l border-[#d1cce7]/20 bg-[#f4f1de]/20 flex-shrink-0 hidden lg:block">
                        <div className="px-4 py-2.5 bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                            <p className="text-xs font-semibold text-[#3d405b]/60">Balance at month end</p>
                        </div>
                        <div className="divide-y divide-[#d1cce7]/10">
                            {ALL_MONTHS.map((month) => {
                                const balance = data.monthlyBalance[month];
                                return (
                                    <div key={month} className="flex items-center justify-between px-4 py-1.5">
                                        <span className="text-xs text-[#3d405b]/50">{month}</span>
                                        <span className={`text-xs font-bold ${balance !== undefined
                                            ? balance > 0 ? "text-emerald-600" : balance === 0 ? "text-red-500" : "text-red-500"
                                            : "text-[#3d405b]/20"
                                            }`}>
                                            {balance !== undefined ? balance : "-"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {loaded && data && data.rows.length > 0 && (
                <div className="px-4 py-3 bg-[#f4f1de]/30 border-t border-[#d1cce7]/20 text-xs text-[#3d405b]/40">
                    แสดง {data.rows.length} รายการ
                </div>
            )}
        </Card>
    );
}
