"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClassSchedule, deleteClassSchedule, duplicateSchedule } from "@/actions/classSchedule";
import { Plus, Trash2, Calendar, Copy, Sparkles, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface EntryData {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title: string;
}

interface ScheduleData {
    id: string;
    theme: string | null;
    startDate: string;
    endDate: string;
    entries: EntryData[];
    _count: { entries: number };
}

const MONTH_NAMES_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const MONTH_NAMES_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_HEADERS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_HEADER_COLORS = [
    "bg-emerald-600", "bg-teal-600", "bg-cyan-600", "bg-sky-600",
    "bg-violet-600", "bg-rose-600", "bg-amber-600",
];

function getMonthDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Get day of week for first day (0=Sun, convert to Mon=0)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: (number | null)[] = [];
    // Pad with nulls for initial empty slots
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    // Pad end to complete the week
    while (days.length % 7 !== 0) days.push(null);
    return days;
}

function dateToString(d: Date) {
    // Use local date parts to avoid UTC shift (Thailand = UTC+7)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function ScheduleList({ schedules, mode = "manage" }: { schedules: ScheduleData[]; mode?: "manage" | "booking" }) {
    const isManage = mode === "manage";
    const now = new Date();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [createDate, setCreateDate] = useState("");
    const [createTheme, setCreateTheme] = useState("");
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const router = useRouter();
    const t = useTranslations("AdminClasses.scheduleList");
    const locale = useLocale();
    const isThai = locale === "th";
    const MONTH_NAMES = isThai ? MONTH_NAMES_TH : MONTH_NAMES_EN;
    const DAY_HEADERS = isThai ? DAY_HEADERS_TH : DAY_HEADERS_EN;

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const handleCreate = async () => {
        if (!createDate) {
            showMsg(t("dateRequired"));
            return;
        }
        setLoading(true);
        const fd = new FormData();
        fd.set("startDate", createDate);
        fd.set("theme", createTheme);
        const result = await createClassSchedule(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else if (result.id) {
            router.push(`/classes/${result.id}`);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteClassSchedule(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg(t("successDelete"));
    };

    const handleDuplicate = async (id: string) => {
        setLoading(true);
        const result = await duplicateSchedule(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else if (result.id) {
            router.push(`/classes/${result.id}`);
        }
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    // Build a map: date string -> entries from schedules
    const dateEntriesMap: Record<string, { entry: EntryData; schedule: ScheduleData }[]> = {};
    const dateScheduleMap: Record<string, ScheduleData> = {};

    schedules.forEach((s) => {
        // Parse startDate
        const start = new Date(s.startDate);
        for (let d = 0; d < 7; d++) {
            const day = new Date(start);
            day.setDate(day.getDate() + d);
            const key = dateToString(day);
            dateScheduleMap[key] = s;
            if (!dateEntriesMap[key]) dateEntriesMap[key] = [];
            const dayEntries = s.entries.filter((e) => e.dayOfWeek === d);
            dayEntries.forEach((entry) => {
                dateEntriesMap[key].push({ entry, schedule: s });
            });
        }
    });

    const monthDays = getMonthDays(viewYear, viewMonth);

    // Filter schedules for current month (any overlap)
    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 0);
    const monthSchedules = schedules.filter((s) => {
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        return sStart <= monthEnd && sEnd >= monthStart;
    });

    return (
        <div>
            <AlertMessage
                type={(message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                message={message}
            />

            {/* Create button (manage mode only) */}
            {isManage && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors shadow-md shadow-[#81b29a]/30"
                    >
                        <Plus size={16} />
                        {t("createNew")}
                    </button>
                </div>
            )}

            {/* Create Form (manage mode only) */}
            {isManage && showCreate && (
                <Card className="mb-6">
                    <h3 className="font-semibold text-[#3d405b] mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" />
                        {t("createNewTitle")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("startDateLabel")}</label>
                            <input
                                type="date"
                                value={createDate}
                                onChange={(e) => setCreateDate(e.target.value)}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("themeLabel")}</label>
                            <input
                                type="text"
                                value={createTheme}
                                onChange={(e) => setCreateTheme(e.target.value)}
                                placeholder={t("themePlaceholder")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b] transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading || !createDate}
                            className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors disabled:opacity-50"
                        >
                            <Plus size={16} />
                            {t("createBtn")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Monthly Calendar */}
            <Card className="mb-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-2 hover:bg-[#d1cce7]/15 rounded-lg transition-colors">
                        <ChevronLeft size={20} className="text-[#3d405b]/60" />
                    </button>
                    <h2 className="text-lg font-bold text-[#3d405b]">
                        {MONTH_NAMES[viewMonth]} {isThai ? viewYear + 543 : viewYear}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-[#d1cce7]/15 rounded-lg transition-colors">
                        <ChevronRight size={20} className="text-[#3d405b]/60" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_HEADERS.map((dh, i) => (
                        <div key={dh} className={`${DAY_HEADER_COLORS[i]} text-white text-center py-1.5 rounded-lg text-xs font-bold`}>
                            {dh}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} className="min-h-[80px] bg-gray-50/50 rounded-lg" />;
                        }

                        const dateKey = dateToString(new Date(viewYear, viewMonth, day));
                        const entries = dateEntriesMap[dateKey] || [];
                        const schedule = dateScheduleMap[dateKey];
                        const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

                        return (
                            <div
                                key={`day-${day}`}
                                className={`min-h-[80px] border rounded-lg p-1 ${isToday ? "border-[#609279] bg-[#81b29a]/5" : "border-[#d1cce7]/20 bg-white"
                                    } ${schedule ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`}
                                onClick={() => schedule && router.push(`/classes/${schedule.id}`)}
                            >
                                <p className={`text-[10px] font-bold mb-0.5 ${isToday ? "text-[#609279]" : "text-[#3d405b]/40"}`}>
                                    {day}
                                </p>
                                <div className="space-y-0.5">
                                    {entries.slice(0, 3).map(({ entry }) => (
                                        <div key={entry.id} className="bg-[#81b29a]/10 rounded px-1 py-0.5">
                                            <p className="text-[8px] text-gray-400 leading-none flex items-center gap-0.5">
                                                <Clock size={7} />
                                                {entry.startTime}
                                            </p>
                                            <p className="text-[9px] font-semibold text-[#3d405b] leading-tight truncate">
                                                {entry.title}
                                            </p>
                                        </div>
                                    ))}
                                    {entries.length > 3 && (
                                        <p className="text-[8px] text-[#609279] font-medium text-center">{t("others", { count: entries.length - 3 })}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Weekly schedule cards for selected month */}
            <h3 className="text-sm font-semibold text-[#3d405b]/60 mb-3">
                {t("monthlySchedules", { month: MONTH_NAMES[viewMonth], count: monthSchedules.length })}
            </h3>
            {monthSchedules.length === 0 ? (
                <Card className="text-center">
                    <div className="py-6">
                        <Calendar size={36} className="mx-auto text-[#3d405b]/20 mb-2" />
                        <p className="text-[#3d405b]/40 text-sm">{t("emptyDay")}</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monthSchedules.map((s) => {
                        const sStart = new Date(s.startDate);
                        const sEnd = new Date(s.endDate);
                        const range = `${sStart.getDate()} - ${sEnd.getDate()} ${sStart.toLocaleDateString("en-US", { month: "short" })} ${sStart.getFullYear()}`;

                        return (
                            <Card key={s.id} className="relative group hover:shadow-md transition-shadow">
                                <Link href={`/classes/${s.id}`} className="block">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-[#81b29a]/10 rounded-xl flex items-center justify-center">
                                                <Calendar size={20} className="text-[#609279]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#3d405b] text-sm">{range}</p>
                                                <p className="text-xs text-[#3d405b]/40">{t("classesCount", { count: s._count.entries })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {s.theme && (
                                        <p className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg line-clamp-2">
                                            🎨 {s.theme}
                                        </p>
                                    )}
                                </Link>
                                {isManage && (
                                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#d1cce7]/15">
                                        <button
                                            onClick={() => handleDuplicate(s.id)}
                                            disabled={loading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#609279] hover:bg-[#81b29a]/10 rounded-lg transition-colors disabled:opacity-50"
                                            title={t("duplicateTooltip")}
                                        >
                                            <Copy size={13} />
                                            {t("duplicateBtn")}
                                        </button>
                                        {deleteConfirmId === s.id ? (
                                            <div className="flex items-center gap-1 ml-auto">
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    disabled={loading}
                                                    className="px-2.5 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    {t("confirmDelete")}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="px-2.5 py-1.5 text-xs text-[#3d405b]/50 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                                                >
                                                    {t("cancel")}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirmId(s.id)}
                                                disabled={loading}
                                                className="ml-auto p-1.5 text-[#3d405b]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title={t("deleteTooltip")}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
