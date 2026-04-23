"use client";

import { useState, useEffect, useTransition } from "react";
import { getFinancialReport, FinancialReportData } from "@/actions/report";
import { TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTranslations } from "next-intl";

const MONTH_LABELS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancialReport() {
    const t = useTranslations("AdminReports.financial");
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<FinancialReportData | null>(null);
    const [isPending, startTransition] = useTransition();

    // Detect locale from translation (heuristic: check if Thai month label is present)
    const isThai = t("monthlyIncome") === "รายได้ (บาท)";
    const monthLabels = isThai ? MONTH_LABELS_TH : MONTH_LABELS_EN;

    useEffect(() => {
        startTransition(async () => {
            const result = await getFinancialReport(year);
            setData(result);
        });
    }, [year]);

    if (!data && isPending) {
        return (
            <div className="text-center py-12 text-[#3d405b]/40">
                {t("loading")}
            </div>
        );
    }

    if (!data) return null;

    const maxIncome = Math.max(...data.months.map(m => m.income), 1);
    const maxDeduction = Math.max(...data.months.map(m => m.deductions), 1);

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-3">
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-[#d1cce7]/30 bg-white text-sm text-[#3d405b] focus:outline-none focus:ring-2 focus:ring-[#81b29a]/30"
                >
                    {data.availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                {isPending && (
                    <RefreshCcw size={16} className="text-[#3d405b]/30 animate-spin" />
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="!p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-[#3d405b]/40 font-medium">{t("totalIncome")}</p>
                            <p className="text-xl font-bold text-emerald-600">
                                ฿{data.totalIncome.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="!p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <TrendingDown size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-xs text-[#3d405b]/40 font-medium">{t("totalDeductions")}</p>
                            <p className="text-xl font-bold text-rose-600">
                                {data.totalDeductions.toLocaleString()} {t("coinsUnit")}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Monthly Bar Chart (visual) */}
            <Card padding={false}>
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h3 className="font-semibold text-[#3d405b]">{t("chartTitle")}</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        {data.months.map((row) => {
                            const incomePercent = maxIncome > 0 ? (row.income / maxIncome) * 100 : 0;
                            const deductPercent = maxDeduction > 0 ? (row.deductions / maxDeduction) * 100 : 0;
                            return (
                                <div key={row.monthIndex} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-[#3d405b]/60">
                                        <span className="font-medium w-10">{monthLabels[row.monthIndex]}</span>
                                        <div className="flex gap-4 text-[10px]">
                                            <span className="text-emerald-600">฿{row.income.toLocaleString()}</span>
                                            <span className="text-rose-500">{row.deductions.toLocaleString()} {t("coinsUnit")}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <div className="flex-1 h-3 bg-[#f4f1de]/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(incomePercent, 0)}%` }}
                                            />
                                        </div>
                                        <div className="flex-1 h-3 bg-[#f4f1de]/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(deductPercent, 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex gap-6 mt-4 pt-4 border-t border-[#d1cce7]/15">
                        <div className="flex items-center gap-2 text-xs text-[#3d405b]/50">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                            {t("monthlyIncome")}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#3d405b]/50">
                            <div className="w-3 h-3 bg-rose-400 rounded-full" />
                            {t("monthlyDeductions")}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Monthly Table */}
            <Card padding={false}>
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h3 className="font-semibold text-[#3d405b]">{t("tableTitle")}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f4f1de]/30 text-[#3d405b]/50 text-xs">
                                <th className="text-left px-6 py-3 font-medium">{t("month")}</th>
                                <th className="text-right px-6 py-3 font-medium">{t("monthlyIncome")}</th>
                                <th className="text-right px-6 py-3 font-medium">{t("monthlyDeductions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1cce7]/10">
                            {data.months.map((row) => (
                                <tr key={row.monthIndex} className="hover:bg-[#f4f1de]/20 transition-colors">
                                    <td className="px-6 py-3 font-medium text-[#3d405b]/70">{monthLabels[row.monthIndex]}</td>
                                    <td className="px-6 py-3 text-right text-emerald-600 font-semibold">
                                        ฿{row.income.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-right text-rose-500 font-semibold">
                                        {row.deductions.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#f4f1de]/30 font-bold text-[#3d405b]">
                                <td className="px-6 py-3">{t("total")}</td>
                                <td className="px-6 py-3 text-right text-emerald-600">
                                    ฿{data.totalIncome.toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-right text-rose-500">
                                    {data.totalDeductions.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    );
}
