"use client";

import { useState, useTransition } from "react";
import { getClassAttendanceReport, ClassAttendanceReport as ReportData } from "@/actions/report";
import {
    Search,
    Check,
    Clock,
    XCircle,
    Ban,
    Coins,
    CalendarDays,
    Filter,
    Users,
    Download,
} from "lucide-react";
import Card from "@/components/ui/Card";
import * as XLSX from "xlsx";
import { useTranslations, useLocale } from "next-intl";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    CHECKED_IN: { label: "เข้าเรียนแล้ว", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: <Check size={12} /> },
    BOOKED: { label: "จองแล้ว", color: "text-blue-700", bgColor: "bg-blue-100", icon: <Clock size={12} /> },
    CANCELLED: { label: "ยกเลิก", color: "text-gray-500", bgColor: "bg-gray-100", icon: <XCircle size={12} /> },
    NO_SHOW: { label: "ไม่มาเรียน", color: "text-red-600", bgColor: "bg-red-100", icon: <Ban size={12} /> },
};

const DAY_LABELS_TH = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];
const DAY_LABELS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getDefaultDateRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
    };
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function ClassAttendanceReport({ initialData }: { initialData: ReportData }) {
    const t = useTranslations("AdminReports.attendance");
    const locale = useLocale();
    const isThai = locale === "th";
    const DAY_LABELS = isThai ? DAY_LABELS_TH : DAY_LABELS_EN;

    const [data, setData] = useState(initialData);
    const [isPending, startTransition] = useTransition();

    const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
        CHECKED_IN: { label: t("status.CHECKED_IN"), color: "text-emerald-700", bgColor: "bg-emerald-100", icon: <Check size={12} /> },
        BOOKED: { label: t("status.BOOKED"), color: "text-blue-700", bgColor: "bg-blue-100", icon: <Clock size={12} /> },
        CANCELLED: { label: t("status.CANCELLED"), color: "text-gray-500", bgColor: "bg-gray-100", icon: <XCircle size={12} /> },
        NO_SHOW: { label: t("status.NO_SHOW"), color: "text-red-600", bgColor: "bg-red-100", icon: <Ban size={12} /> },
    };

    const defaults = getDefaultDateRange();
    const [dateFrom, setDateFrom] = useState(defaults.from);
    const [dateTo, setDateTo] = useState(defaults.to);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    function handleSearch() {
        startTransition(async () => {
            const result = await getClassAttendanceReport(
                dateFrom,
                dateTo,
                statusFilter !== "ALL" ? statusFilter : undefined,
                searchQuery || undefined,
            );
            setData(result);
        });
    }

    function exportToExcel() {
        if (data.rows.length === 0) return;
        const STATUS_LABEL: Record<string, string> = {
            CHECKED_IN: t("status.CHECKED_IN"),
            BOOKED: t("status.BOOKED"),
            CANCELLED: t("status.CANCELLED"),
            NO_SHOW: t("status.NO_SHOW"),
        };
        const exportData = data.rows.map((row) => ({
            [t("table.bookingDate")]: formatDate(row.createdAt),
            [t("table.class")]: row.className,
            [t("table.participant")]: row.participantName,
            [t("table.parent")]: row.parentName,
            [t("table.phone")]: row.phone,
            [t("table.dayTime")]: DAY_LABELS[row.dayOfWeek],
            "Time": `${row.startTime}-${row.endTime}`,
            [t("table.status")]: STATUS_LABEL[row.status] || row.status,
            [t("table.coins")]: row.coinsCharged,
            [t("table.checkIn")]: row.checkedInAt ? formatTime(row.checkedInAt) : "-",
            "Booked By": row.bookedByName,
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "รายงานเข้าคลาส");
        XLSX.writeFile(wb, `class_attendance_${dateFrom}_${dateTo}.xlsx`);
    }

    const { summary } = data;

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Card className="!p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Users size={14} className="text-[#3d405b]/40" />
                        <p className="text-xs text-[#3d405b]/50 font-medium">{t("summary.all")}</p>
                    </div>
                    <p className="text-xl font-bold text-[#3d405b]">{summary.total}</p>
                </Card>
                <Card className="!p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Check size={14} className="text-emerald-500" />
                        <p className="text-xs text-emerald-600 font-medium">{t("summary.checkedIn")}</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">{summary.checkedIn}</p>
                </Card>
                <Card className="!p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Clock size={14} className="text-blue-500" />
                        <p className="text-xs text-blue-600 font-medium">{t("summary.booked")}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{summary.booked}</p>
                </Card>
                <Card className="!p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <XCircle size={14} className="text-gray-400" />
                        <p className="text-xs text-gray-500 font-medium">{t("summary.cancelled")}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-500">{summary.cancelled}</p>
                </Card>
                <Card className="!p-3 text-center col-span-2 md:col-span-1">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Ban size={14} className="text-red-400" />
                        <p className="text-xs text-red-500 font-medium">{t("summary.noShow")}</p>
                    </div>
                    <p className="text-xl font-bold text-red-500">{summary.noShow}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <CalendarDays size={16} className="text-[#3d405b]/30 flex-shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="flex-1 px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] bg-white"
                        />
                        <span className="text-xs text-[#3d405b]/30">{t("filters.to")}</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="flex-1 px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-[#3d405b]/30 flex-shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 bg-white"
                        >
                            <option value="ALL">{t("filters.allStatus")}</option>
                            <option value="CHECKED_IN">{t("status.CHECKED_IN")}</option>
                            <option value="BOOKED">{t("status.BOOKED")}</option>
                            <option value="CANCELLED">{t("status.CANCELLED")}</option>
                            <option value="NO_SHOW">{t("status.NO_SHOW")}</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-1 md:max-w-[220px]">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder={t("filters.searchPlaceholder")}
                                className="w-full pl-9 pr-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={isPending}
                        className="px-5 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50 transition-colors flex items-center gap-1.5 justify-center"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Search size={14} />
                        )}
                        {t("filters.searchBtn")}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={data.rows.length === 0}
                        className="px-5 py-2 bg-[#3d405b] text-white rounded-xl text-sm font-medium hover:bg-[#2d2f45] disabled:opacity-30 transition-colors flex items-center gap-1.5 justify-center"
                    >
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </Card>

            {/* Data Table */}
            <Card padding={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.bookingDate")}</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.class")}</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.participant")}</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.dayTime")}</th>
                                <th className="text-center px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.status")}</th>
                                <th className="text-right px-4 py-3 font-semibold text-[#3d405b]/70">{t("table.coins")}</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#3d405b]/70 hidden md:table-cell">{t("table.checkIn")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-[#3d405b]/30">
                                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                                        <p>{t("table.empty")}</p>
                                    </td>
                                </tr>
                            ) : (
                                data.rows.map((row) => {
                                    const st = STATUS_CONFIG[row.status] || STATUS_CONFIG.BOOKED;
                                    return (
                                        <tr key={row.id} className="border-b border-[#d1cce7]/15 hover:bg-[#f4f1de]/30 transition-colors">
                                            <td className="px-4 py-3 text-[#3d405b]/70 whitespace-nowrap">
                                                {formatDate(row.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[#3d405b]">{row.className}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[#3d405b]">{row.participantName}</p>
                                                {row.participantName !== row.parentName && (
                                                    <p className="text-[10px] text-[#3d405b]/40">ผู้ปกครอง: {row.parentName}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-[#3d405b]/70">{DAY_LABELS[row.dayOfWeek]}</p>
                                                <p className="text-xs text-[#3d405b]/40">{row.startTime}-{row.endTime}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`${st.bgColor} ${st.color} px-2.5 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1`}>
                                                    {st.icon}
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.coinsCharged > 0 ? (
                                                    <span className="text-amber-600 font-medium flex items-center justify-end gap-1">
                                                        <Coins size={12} />
                                                        {row.coinsCharged}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#3d405b]/20">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap text-[#3d405b]/50 text-xs">
                                                {row.checkedInAt ? formatTime(row.checkedInAt) : "—"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {data.rows.length > 0 && (
                    <div className="px-4 py-3 bg-[#f4f1de]/30 border-t border-[#d1cce7]/20 text-xs text-[#3d405b]/40">
                        {t("table.showing", { count: data.rows.length })}
                    </div>
                )}
            </Card>
        </div>
    );
}
