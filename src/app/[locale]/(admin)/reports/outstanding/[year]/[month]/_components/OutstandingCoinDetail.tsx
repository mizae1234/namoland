"use client";

import { OutstandingCoinDetailData } from "@/actions/report";
import { ArrowLeft, Download, User, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useTranslations, useLocale } from "next-intl";
import * as XLSX from "xlsx";
import Link from "next/link";

function fmt(n: number) {
    if (n === 0) return "-";
    return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OutstandingCoinDetail({ data }: { data: OutstandingCoinDetailData }) {
    const t = useTranslations("AdminReports.outstandingDetail");
    const router = useRouter();
    const locale = useLocale();

    function exportToExcel() {
        const rows = data.rows.map((r, i) => ({
            "#": i + 1,
            [t("memberName")]: r.memberName,
            "Children": r.childrenNames,
            [t("phone")]: r.phone,
            [t("coinBalance")]: r.coinBalance,
            [t("amount")]: r.amount,
            [t("gross")]: r.grossAmount,
            [t("discount")]: r.discount,
        }));
        rows.push({
            "#": "",
            [t("memberName")]: t("total"),
            "Children": "",
            [t("phone")]: "",
            [t("coinBalance")]: data.totals.coinBalance,
            [t("amount")]: data.totals.amount,
            [t("gross")]: data.totals.grossAmount,
            [t("discount")]: data.totals.discount,
        } as any);

        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [
            { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
            { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `${data.month} ${data.year}`);
        XLSX.writeFile(wb, `outstanding_detail_${data.year}_${data.month}.xlsx`);
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push(`/${locale}/reports`)}
                    className="p-2 rounded-lg border border-[#d1cce7]/30 hover:bg-[#f4f1de]/50 transition-colors"
                >
                    <ArrowLeft size={18} className="text-[#3d405b]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#3d405b] flex items-center gap-2">
                        <Coins size={20} className="text-amber-500" />
                        {t("title")} — {data.month} {data.year}
                    </h1>
                    <p className="text-xs text-[#3d405b]/50 mt-0.5">
                        {t("subtitle", { count: data.rows.length })}
                    </p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-lg text-sm font-medium hover:bg-[#4e7a63] transition-colors"
                >
                    <Download size={14} />
                    {t("exportBtn")}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card className="!bg-amber-50 border border-amber-200">
                    <div className="text-xs font-medium text-amber-600/70 mb-1">{t("coinBalance")}</div>
                    <p className="text-xl font-bold text-amber-700">{data.totals.coinBalance.toLocaleString()}</p>
                </Card>
                <Card className="!bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-medium text-emerald-600/70 mb-1">{t("amount")}</div>
                    <p className="text-xl font-bold text-emerald-700">฿{data.totals.amount.toLocaleString()}</p>
                </Card>
                <Card className="!bg-sky-50 border border-sky-200">
                    <div className="text-xs font-medium text-sky-600/70 mb-1">{t("gross")}</div>
                    <p className="text-xl font-bold text-sky-700">฿{data.totals.grossAmount.toLocaleString()}</p>
                </Card>
                <Card className="!bg-violet-50 border border-violet-200">
                    <div className="text-xs font-medium text-violet-600/70 mb-1">{t("discount")}</div>
                    <p className="text-xl font-bold text-violet-700">฿{data.totals.discount.toLocaleString()}</p>
                </Card>
            </div>

            {/* Table */}
            <Card padding={false} className="overflow-hidden">
                <div className="px-4 py-3 border-b border-[#d1cce7]/20 bg-[#f4f1de]/30">
                    <h3 className="font-semibold text-[#3d405b] text-sm flex items-center gap-2">
                        <User size={14} className="text-[#609279]" />
                        {t("tableTitle")}
                        <span className="ml-auto text-xs font-normal text-[#3d405b]/40">
                            {data.rows.length} {t("members")}
                        </span>
                    </h3>
                </div>

                {data.rows.length === 0 ? (
                    <div className="py-12 text-center text-[#3d405b]/40 text-sm">
                        {t("noData")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/20 text-left">
                                    <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs w-[40px]">#</th>
                                    <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs">{t("memberName")}</th>
                                    <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs">{t("phone")}</th>
                                    <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("coinBalance")}</th>
                                    <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("amount")}</th>
                                    <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("gross")}</th>
                                    <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("discount")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d1cce7]/10">
                                {data.rows.map((row, idx) => (
                                    <tr key={row.userId} className="hover:bg-[#f4f1de]/30 transition-colors">
                                        <td className="py-2 px-4 text-[#3d405b]/40 text-xs">{idx + 1}</td>
                                        <td className="py-2 px-4 whitespace-nowrap">
                                            <Link
                                                href={`/${locale}/members/${row.userId}`}
                                                className="text-sm font-medium text-[#609279] hover:underline"
                                            >
                                                {row.memberName}
                                            </Link>
                                            {row.childrenNames && (
                                                <div className="text-xs text-[#3d405b]/50 mt-0.5 truncate max-w-[150px]" title={row.childrenNames}>
                                                    ({row.childrenNames})
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 text-[#3d405b]/60 text-xs">{row.phone}</td>
                                        <td className="py-2 px-3 text-right font-mono text-sm font-medium text-[#3d405b]">
                                            {row.coinBalance}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-sm text-[#3d405b]">
                                            {fmt(row.amount)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-sm text-[#3d405b]">
                                            {fmt(row.grossAmount)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-sm text-[#3d405b]">
                                            {fmt(row.discount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-[#f4f1de]/50 border-t-2 border-[#d1cce7]/30 font-semibold">
                                    <td colSpan={3} className="py-2.5 px-4 text-xs text-[#3d405b]/60">{t("total")}</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#3d405b]">
                                        {data.totals.coinBalance.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#3d405b]">
                                        {fmt(data.totals.amount)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#3d405b]">
                                        {fmt(data.totals.grossAmount)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#3d405b]">
                                        {fmt(data.totals.discount)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
