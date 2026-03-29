"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { CalendarCheck, Check, Clock, XCircle, Ban, RefreshCw, Coins } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTranslations, useLocale } from "next-intl";

type BookingRecord = {
    id: string;
    status: string;
    coinsCharged: number;
    checkedInAt: string | null;
    createdAt: string;
    note: string | null;
    childName: string | null;
    className: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    bookedByName: string;
};

async function fetchBookings(userId: string): Promise<BookingRecord[]> {
    const res = await fetch(`/api/members/${userId}/bookings`);
    if (!res.ok) return [];
    return res.json();
}

export default function MemberBookingHistory({ userId, memberName }: { userId: string; memberName?: string }) {
    const t = useTranslations("AdminMembers.detail.bookingHistory");
    const locale = useLocale();
    const dateLocale = locale === "en" ? enUS : th;
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isPending, startTransition] = useTransition();
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState<string>("ALL");

    const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
        CHECKED_IN: { label: t("statusCheckedIn"), color: "text-emerald-700", bgColor: "bg-emerald-100", icon: <Check size={12} /> },
        BOOKED: { label: t("statusBooked"), color: "text-amber-700", bgColor: "bg-amber-100", icon: <Clock size={12} /> },
        CANCELLED: { label: t("statusCancelled"), color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle size={12} /> },
        NO_SHOW: { label: t("statusNoShow"), color: "text-gray-600", bgColor: "bg-gray-100", icon: <Ban size={12} /> },
    };

    useEffect(() => {
        if (!loaded && !isPending) {
            loadBookings();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function loadBookings() {
        startTransition(async () => {
            const data = await fetchBookings(userId);
            setBookings(data);
            setLoaded(true);
        });
    }

    function exportToExcel() {
        if (!bookings || bookings.length === 0) return;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const XLSX = require("xlsx-js-style");

        const wb = XLSX.utils.book_new();
        const ws: Record<string, unknown> = {};

        const borderThin = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        const headerStyle = { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: "D9D9D9" } }, border: borderThin, alignment: { horizontal: "center", vertical: "center" } };
        const normalStyle = { font: { sz: 10 }, border: borderThin };
        const normalCenter = { ...normalStyle, alignment: { horizontal: "center" } };
        
        const statusColors: Record<string, { fgColor: { rgb: string } }> = {
            CHECKED_IN: { fgColor: { rgb: "C6EFCE" } },
            BOOKED: { fgColor: { rgb: "FFEB9C" } },
            CANCELLED: { fgColor: { rgb: "FFC7CE" } },
            NO_SHOW: { fgColor: { rgb: "E0E0E0" } },
        };

        ws["A1"] = { v: t("excelTitle", { name: memberName || t("excelMember") }), s: { font: { bold: true, sz: 12 } } };

        const headers = [
            t("excelHeaders.date"), t("excelHeaders.class"), t("excelHeaders.student"),
            t("excelHeaders.schedule"), t("excelHeaders.status"), t("excelHeaders.coins"),
            t("excelHeaders.checkin"), t("excelHeaders.bookedBy")
        ];
        const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
        headers.forEach((h, i) => {
            ws[`${cols[i]}3`] = { v: h, s: headerStyle };
        });

        const dataToExport = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

        dataToExport.forEach((b, i) => {
            const r = i + 4;
            const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.BOOKED;
            const statusStyle = { ...normalCenter, fill: statusColors[b.status] || { fgColor: { rgb: "FFFFFF" } } };
            const style = normalStyle;

            ws[`A${r}`] = { v: format(new Date(b.createdAt), "dd/MM/yyyy", { locale: dateLocale }), s: normalCenter };
            ws[`B${r}`] = { v: b.className, s: style };
            ws[`C${r}`] = { v: b.childName || "-", s: style };
            ws[`D${r}`] = { v: `${t(`days.${b.dayOfWeek}`)} ${b.startTime}-${b.endTime}`, s: style };
            ws[`E${r}`] = { v: st.label, s: statusStyle };
            ws[`F${r}`] = { v: b.coinsCharged > 0 ? b.coinsCharged : "-", s: normalCenter };
            ws[`G${r}`] = { v: b.checkedInAt ? format(new Date(b.checkedInAt), "HH:mm", { locale: dateLocale }) : "-", s: normalCenter };
            ws[`H${r}`] = { v: b.bookedByName, s: style };
        });

        ws["!ref"] = `A1:H${dataToExport.length + 3}`;
        ws["!cols"] = [
            { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, 
            { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Booking History");
        XLSX.writeFile(wb, `bookings_${(memberName || "member").replace(/\s/g, "_")}.xlsx`);
    }

    const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

    const total = bookings.length;
    const checkedIn = bookings.filter(b => b.status === "CHECKED_IN").length;
    const booked = bookings.filter(b => b.status === "BOOKED").length;
    const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
    const totalCoins = bookings.reduce((s, b) => s + b.coinsCharged, 0);

    const filterTabs: [string, string][] = [
        ["ALL", t("filterAll")],
        ["CHECKED_IN", t("filterCheckedIn")],
        ["BOOKED", t("filterBooked")],
        ["CANCELLED", t("filterCancelled")],
        ["NO_SHOW", t("filterNoShow")],
    ];

    return (
        <Card padding={false} className="mb-6">
            <div className="p-6 border-b border-[#d1cce7]/20 flex items-center justify-between">
                <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                    <CalendarCheck size={18} className="text-blue-500" />
                    {t("title")}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={loadBookings}
                        disabled={isPending}
                        className="px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                        {isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RefreshCw size={14} />
                        )}
                        {loaded ? t("refresh") : t("loadData")}
                    </button>
                    
                    {loaded && bookings.length > 0 && (
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-[#3d405b] text-white rounded-xl text-sm font-medium hover:bg-[#2d2f45] transition-colors flex items-center gap-1.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export Excel
                        </button>
                    )}
                </div>
            </div>

            {!loaded && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <CalendarCheck size={32} className="mx-auto mb-2 opacity-40" />
                    <p>{t("loadHint")}</p>
                </div>
            )}

            {loaded && bookings.length === 0 && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <p>{t("empty")}</p>
                </div>
            )}

            {loaded && bookings.length > 0 && (
                <>
                    <div className="grid grid-cols-5 gap-3 p-4 border-b border-[#d1cce7]/20">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-blue-600/60 mb-1">{t("summaryTotal")}</p>
                            <p className="text-lg font-bold text-blue-600">{total}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-emerald-600/60 mb-1">{t("summaryCheckedIn")}</p>
                            <p className="text-lg font-bold text-emerald-600">{checkedIn}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-amber-600/60 mb-1">{t("summaryBooked")}</p>
                            <p className="text-lg font-bold text-amber-600">{booked}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-red-500/60 mb-1">{t("summaryCancelled")}</p>
                            <p className="text-lg font-bold text-red-500">{cancelled}</p>
                        </div>
                        <div className="bg-[#f4f1de] rounded-xl p-3 text-center">
                            <p className="text-xs text-[#3d405b]/40 mb-1">{t("summaryCoins")}</p>
                            <p className="text-lg font-bold text-[#609279] flex items-center justify-center gap-1">
                                <Coins size={14} /> {totalCoins}
                            </p>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b border-[#d1cce7]/10 flex gap-1.5">
                        {filterTabs.map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${filter === val
                                    ? "bg-[#609279] text-white"
                                    : "bg-[#f4f1de]/50 text-[#3d405b]/40 hover:text-[#3d405b]/60"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thBookingDate")}</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thClass")}</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thStudent")}</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thSchedule")}</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thStatus")}</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thCoins")}</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thCheckin")}</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">{t("thBookedBy")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => {
                                    const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.BOOKED;
                                    return (
                                        <tr key={b.id} className="border-b border-[#d1cce7]/10 hover:bg-[#f4f1de]/20 transition-colors">
                                            <td className="px-3 py-2.5 text-[#3d405b]/70 whitespace-nowrap text-xs">
                                                {format(new Date(b.createdAt), "d MMM yy", { locale: dateLocale })}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b] font-medium text-xs max-w-[200px] truncate">
                                                {b.className}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/60 text-xs">
                                                {b.childName || "-"}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/50 whitespace-nowrap text-xs">
                                                {t(`days.${b.dayOfWeek}`)} {b.startTime}-{b.endTime}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bgColor} ${st.color}`}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                {b.coinsCharged > 0 ? (
                                                    <span className="text-xs font-medium text-[#609279] flex items-center justify-center gap-0.5">
                                                        <Coins size={10} /> {b.coinsCharged}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[#3d405b]/20">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/50 text-xs whitespace-nowrap">
                                                {b.checkedInAt
                                                    ? format(new Date(b.checkedInAt), "HH:mm", { locale: dateLocale })
                                                    : "—"
                                                }
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/40 text-xs">
                                                {b.bookedByName}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-3 bg-[#f4f1de]/30 border-t border-[#d1cce7]/20 text-xs text-[#3d405b]/40">
                        {t("showing", { filtered: filtered.length, total })}
                    </div>
                </>
            )}
        </Card>
    );
}
