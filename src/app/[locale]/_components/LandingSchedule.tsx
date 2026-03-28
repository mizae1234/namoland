"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";

const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_COLORS = [
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-amber-500",
];

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

interface EntryData {
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
}

export default function LandingSchedule({ schedules }: { schedules: ScheduleData[] }) {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Filter schedules for current month
    const monthSchedules = schedules.filter((s) => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        return start <= monthEnd && end >= monthStart;
    });

    // Build calendar grid
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = lastDay.getDate();

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
    while (calendarDays.length % 7 !== 0) calendarDays.push(null);

    // Map entries to days
    const getEntriesForDay = (day: number): EntryData[] => {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0
        const entries: EntryData[] = [];
        for (const sch of monthSchedules) {
            const start = new Date(sch.startDate);
            const end = new Date(sch.endDate);
            if (date >= start && date <= end) {
                entries.push(...sch.entries.filter((e) => e.dayOfWeek === dayOfWeek));
            }
        }
        return entries.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const thaiYear = currentYear + 543;
    const today = now.getDate();
    const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear;

    if (schedules.length === 0) return null;

    return (
        <section id="programs" className="py-20 bg-gradient-to-b from-[#f4f1de] to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#a16b9f]/10 rounded-full text-sm font-medium text-[#a16b9f] mb-4">
                        <Calendar size={14} />
                        ตารางคลาส
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-[#3d405b] mb-4">
                        ตารางกิจกรรม<span className="text-[#a16b9f]">ประจำเดือน</span>
                    </h2>
                    <p className="text-[#3d405b]/60 max-w-2xl mx-auto">
                        ดูตารางกิจกรรมทั้งเดือน สมัครสมาชิกเพื่อจองคลาสที่สนใจ
                    </p>
                </div>

                {/* Calendar */}
                <div className="max-w-4xl mx-auto">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-[#d1cce7]/20 rounded-xl transition-colors"
                        >
                            <ChevronLeft size={20} className="text-[#3d405b]/50" />
                        </button>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#3d405b]">
                            {THAI_MONTHS[currentMonth]} {thaiYear}
                        </h3>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-[#d1cce7]/20 rounded-xl transition-colors"
                        >
                            <ChevronRight size={20} className="text-[#3d405b]/50" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAY_LABELS.map((label, i) => (
                            <div
                                key={i}
                                className={`${DAY_COLORS[i]} text-white text-center py-2 text-xs sm:text-sm font-bold rounded-t-lg`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            if (day === null) {
                                return <div key={idx} className="bg-gray-50/50 min-h-[80px] sm:min-h-[100px] rounded-sm" />;
                            }

                            const entries = getEntriesForDay(day);
                            const isToday = isCurrentMonth && day === today;

                            return (
                                <div
                                    key={idx}
                                    className={`bg-white border border-[#d1cce7]/10 min-h-[80px] sm:min-h-[100px] p-1 rounded-sm relative ${isToday ? "ring-2 ring-[#e07a5f]/50" : ""
                                        }`}
                                >
                                    <span
                                        className={`text-[10px] sm:text-xs font-bold ${isToday
                                                ? "bg-[#e07a5f] text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                                                : "text-[#3d405b]/40"
                                            }`}
                                    >
                                        {day}
                                    </span>
                                    <div className="mt-0.5 space-y-0.5">
                                        {entries.slice(0, 3).map((e, eIdx) => (
                                            <div
                                                key={eIdx}
                                                className="bg-[#81b29a]/10 rounded px-1 py-0.5 truncate"
                                            >
                                                <p className="text-[7px] sm:text-[9px] font-medium text-[#609279] truncate flex items-center gap-0.5">
                                                    <Clock size={7} className="flex-shrink-0" />
                                                    {e.startTime}
                                                </p>
                                                <p className="text-[7px] sm:text-[9px] font-bold text-[#3d405b] truncate leading-tight">
                                                    {e.title}
                                                </p>
                                            </div>
                                        ))}
                                        {entries.length > 3 && (
                                            <p className="text-[7px] text-[#3d405b]/30 text-center">
                                                +{entries.length - 3} อื่นๆ
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Weekly schedule cards below */}
                    {monthSchedules.length > 0 && (
                        <div className="mt-8 space-y-3">
                            {monthSchedules.map((sch) => {
                                const s = new Date(sch.startDate);
                                const e = new Date(sch.endDate);
                                return (
                                    <div
                                        key={sch.id}
                                        className="bg-white rounded-2xl border border-[#d1cce7]/20 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-bold text-[#609279]">
                                                    {s.getDate()} - {e.getDate()} {THAI_MONTHS[s.getMonth()]} {s.getFullYear() + 543}
                                                </p>
                                                {sch.theme && (
                                                    <p className="text-xs text-[#e07a5f] font-medium mt-0.5">
                                                        Theme: {sch.theme}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-[#3d405b]/30">
                                                {sch.entries.length} คลาส
                                            </span>
                                        </div>

                                        {/* Mini weekly grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 7 }, (_, dayIdx) => {
                                                const dayEntries = sch.entries
                                                    .filter((en) => en.dayOfWeek === dayIdx)
                                                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                                                return (
                                                    <div key={dayIdx} className="text-center">
                                                        <p className={`text-[8px] sm:text-[10px] font-bold text-white ${DAY_COLORS[dayIdx]} rounded-t px-1 py-0.5`}>
                                                            {DAY_LABELS[dayIdx]}
                                                        </p>
                                                        <div className="bg-gray-50 rounded-b min-h-[40px] p-0.5 space-y-0.5">
                                                            {dayEntries.map((en, enIdx) => (
                                                                <div key={enIdx} className="bg-white rounded px-0.5 py-0.5 border border-gray-100">
                                                                    <p className="text-[6px] sm:text-[8px] text-gray-400">{en.startTime}</p>
                                                                    <p className="text-[6px] sm:text-[8px] font-semibold text-[#3d405b] truncate leading-tight">{en.title}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
