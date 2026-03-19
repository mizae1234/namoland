"use client";

import { useState } from "react";
import {
    addClassEntry,
    updateClassEntry,
    deleteClassEntry,
    updateClassSchedule,
} from "@/actions/classSchedule";
import { Plus, Pencil, Trash2, Check, X, Clock, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import BookingPanel from "./BookingPanel";

const DAY_LABELS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS_TH = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];

const DAY_COLORS = [
    { bg: "bg-emerald-600", header: "bg-emerald-600", card: "bg-emerald-50 border-emerald-200" },
    { bg: "bg-teal-600", header: "bg-teal-600", card: "bg-teal-50 border-teal-200" },
    { bg: "bg-cyan-600", header: "bg-cyan-600", card: "bg-cyan-50 border-cyan-200" },
    { bg: "bg-sky-600", header: "bg-sky-600", card: "bg-sky-50 border-sky-200" },
    { bg: "bg-violet-600", header: "bg-violet-600", card: "bg-violet-50 border-violet-200" },
    { bg: "bg-rose-600", header: "bg-rose-600", card: "bg-rose-50 border-rose-200" },
    { bg: "bg-amber-600", header: "bg-amber-600", card: "bg-amber-50 border-amber-200" },
];

interface ActivityData {
    id: string;
    name: string;
    coins: number;
}

interface EntryData {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title: string;
    sortOrder: number;
}

interface ScheduleData {
    id: string;
    theme: string | null;
    startDate: string;
    endDate: string;
    entries: EntryData[];
}

function parseLocalDate(isoStr: string) {
    const [y, m, d] = isoStr.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, d);
}

function formatDateRange(startStr: string, endStr: string) {
    const s = parseLocalDate(startStr);
    const e = parseLocalDate(endStr);
    const sDay = s.getDate();
    const eDay = e.getDate();
    const month = s.toLocaleDateString("en-US", { month: "short" });
    const year = s.getFullYear();
    return `${sDay} - ${eDay} ${month} ${year}`;
}

function getDayDate(startStr: string, dayOfWeek: number) {
    const d = parseLocalDate(startStr);
    d.setDate(d.getDate() + dayOfWeek);
    return d.getDate();
}

function maskTime(raw: string): string {
    // Strip non-digits
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "." + digits.slice(2);
}

export default function WeeklyCalendar({ schedule, activities }: { schedule: ScheduleData; activities: ActivityData[] }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [editingTheme, setEditingTheme] = useState(false);
    const [themeInput, setThemeInput] = useState(schedule.theme || "");

    // Add entry state
    const [addingDay, setAddingDay] = useState<number | null>(null);
    const [addActivityId, setAddActivityId] = useState("");
    const [addStart, setAddStart] = useState("");
    const [addEnd, setAddEnd] = useState("");
    const [addCustomTitle, setAddCustomTitle] = useState("");

    // Edit entry state
    const [editEntryId, setEditEntryId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editStart, setEditStart] = useState("");
    const [editEnd, setEditEnd] = useState("");

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Booking panel
    const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null);

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    // Group entries by day, sorted by startTime
    const entriesByDay: Record<number, EntryData[]> = {};
    for (let d = 0; d < 7; d++) entriesByDay[d] = [];
    schedule.entries.forEach((e) => {
        if (entriesByDay[e.dayOfWeek]) entriesByDay[e.dayOfWeek].push(e);
    });
    for (let d = 0; d < 7; d++) {
        entriesByDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    // Selected activity name
    const selectedActivity = activities.find((a) => a.id === addActivityId);
    const isCustomActivity = selectedActivity?.coins === 0; // "รายการอื่นๆ..." has 0 coins

    const handleThemeSave = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", schedule.id);
        fd.set("theme", themeInput);
        const result = await updateClassSchedule(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("อัปเดตธีมสำเร็จ!");
            setEditingTheme(false);
        }
    };

    const handleAddEntry = async () => {
        if (addingDay === null) return;
        const title = isCustomActivity ? addCustomTitle : (selectedActivity?.name || "");
        if (!title || !addStart || !addEnd) {
            showMsg("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        setLoading(true);
        const fd = new FormData();
        fd.set("scheduleId", schedule.id);
        fd.set("dayOfWeek", String(addingDay));
        fd.set("startTime", addStart);
        fd.set("endTime", addEnd);
        fd.set("title", title);
        fd.set("sortOrder", String((entriesByDay[addingDay]?.length || 0) + 1));
        const result = await addClassEntry(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("เพิ่มคลาสสำเร็จ!");
            setAddingDay(null);
            setAddActivityId("");
            setAddStart("");
            setAddEnd("");
            setAddCustomTitle("");
        }
    };

    const startEditEntry = (entry: EntryData) => {
        setEditEntryId(entry.id);
        setEditTitle(entry.title);
        setEditStart(entry.startTime);
        setEditEnd(entry.endTime);
    };

    const handleUpdateEntry = async () => {
        if (!editEntryId) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("id", editEntryId);
        fd.set("startTime", editStart);
        fd.set("endTime", editEnd);
        fd.set("title", editTitle);
        const result = await updateClassEntry(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("อัปเดตคลาสสำเร็จ!");
            setEditEntryId(null);
        }
    };

    const handleDeleteEntry = async (id: string) => {
        setLoading(true);
        const result = await deleteClassEntry(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg("ลบคลาสสำเร็จ!");
    };

    return (
        <div>
            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
            />

            {/* Calendar Header */}
            <Card className="mb-6 !bg-[#f4f1de] border-2 border-[#e07a5f]/20">
                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-extrabold text-[#609279] mb-1">
                        Weekly Calendar {formatDateRange(schedule.startDate, schedule.endDate)}
                    </h2>
                    {editingTheme ? (
                        <div className="flex items-center gap-2 justify-center mt-2">
                            <input
                                type="text"
                                value={themeInput}
                                onChange={(e) => setThemeInput(e.target.value)}
                                placeholder="ธีมประจำสัปดาห์..."
                                className="px-3 py-1.5 border border-[#d1cce7]/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 text-center w-full max-w-md"
                            />
                            <button
                                onClick={handleThemeSave}
                                disabled={loading}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => setEditingTheme(false)}
                                className="p-1.5 text-[#3d405b]/40 hover:bg-[#d1cce7]/15 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <p
                            className="text-sm md:text-base text-[#e07a5f] font-bold uppercase tracking-wide cursor-pointer hover:opacity-70 transition-opacity mt-1"
                            onClick={() => setEditingTheme(true)}
                            title="คลิกเพื่อแก้ไขธีม"
                        >
                            {schedule.theme ? `THEME: ${schedule.theme}` : "+ เพิ่มธีม"}
                        </p>
                    )}
                </div>
            </Card>

            {/* Weekly Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                    const dayEntries = entriesByDay[dayIdx] || [];
                    const colors = DAY_COLORS[dayIdx];
                    const dayDate = getDayDate(schedule.startDate, dayIdx);

                    return (
                        <div key={dayIdx} className="flex flex-col">
                            {/* Day Header */}
                            <div className={`${colors.header} text-white text-center py-2 rounded-t-xl`}>
                                <p className="text-xs font-bold tracking-wider">{DAY_LABELS[dayIdx]}</p>
                                <p className="text-[10px] opacity-80">{DAY_LABELS_TH[dayIdx]} ({dayDate})</p>
                            </div>

                            {/* Entries */}
                            <div className="bg-white border border-[#d1cce7]/20 border-t-0 rounded-b-xl flex-1 min-h-[200px] p-1.5 space-y-1.5">
                                {dayEntries.map((entry) => (
                                    <div key={entry.id}>
                                        {editEntryId === entry.id ? (
                                            <div className={`${colors.card} border rounded-lg p-2 space-y-1.5`}>
                                                <input
                                                    type="text"
                                                    value={editStart}
                                                    onChange={(e) => setEditStart(maskTime(e.target.value))}
                                                    placeholder="10.00"
                                                    maxLength={5}
                                                    inputMode="numeric"
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={editEnd}
                                                    onChange={(e) => setEditEnd(maskTime(e.target.value))}
                                                    placeholder="12.00"
                                                    maxLength={5}
                                                    inputMode="numeric"
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none"
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={handleUpdateEntry}
                                                        disabled={loading}
                                                        className="flex-1 py-1 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
                                                    >
                                                        บันทึก
                                                    </button>
                                                    <button
                                                        onClick={() => setEditEntryId(null)}
                                                        className="flex-1 py-1 text-[10px] bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`${colors.card} border rounded-lg p-2 group relative cursor-pointer`}
                                                onClick={() => setSelectedEntry(entry)}
                                                title="คลิกเพื่อดูผู้จอง"
                                            >
                                                <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
                                                    <Clock size={9} />
                                                    {entry.startTime}-{entry.endTime}
                                                </p>
                                                <p className="text-[11px] font-bold text-[#3d405b] leading-tight mt-0.5">
                                                    {entry.title}
                                                </p>
                                                <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => startEditEntry(entry)}
                                                        className="p-1 bg-white/80 rounded hover:bg-white shadow-sm"
                                                        title="แก้ไข"
                                                    >
                                                        <Pencil size={10} className="text-[#609279]" />
                                                    </button>
                                                    {deleteConfirmId === entry.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                                disabled={loading}
                                                                className="p-1 bg-red-500 text-white rounded text-[9px] px-1.5"
                                                            >
                                                                ลบ
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="p-1 bg-white/80 rounded text-[9px] px-1.5"
                                                            >
                                                                ✕
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(entry.id)}
                                                            className="p-1 bg-white/80 rounded hover:bg-white shadow-sm"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={10} className="text-red-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add entry with activity dropdown */}
                                {addingDay === dayIdx ? (
                                    <div className="border-2 border-dashed border-[#81b29a]/40 rounded-lg p-2 space-y-1.5">
                                        <select
                                            value={addActivityId}
                                            onChange={(e) => { setAddActivityId(e.target.value); setAddCustomTitle(""); }}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30 bg-white"
                                        >
                                            <option value="">-- เลือกกิจกรรม --</option>
                                            {activities.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name} {a.coins > 0 ? `(${a.coins} เหรียญ)` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {isCustomActivity && (
                                            <input
                                                type="text"
                                                value={addCustomTitle}
                                                onChange={(e) => setAddCustomTitle(e.target.value)}
                                                placeholder="ระบุชื่อกิจกรรม..."
                                                className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                        )}
                                        <div className="grid grid-cols-2 gap-1">
                                            <input
                                                type="text"
                                                value={addStart}
                                                onChange={(e) => setAddStart(maskTime(e.target.value))}
                                                placeholder="เริ่ม 10.00"
                                                maxLength={5}
                                                inputMode="numeric"
                                                className="px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                            <input
                                                type="text"
                                                value={addEnd}
                                                onChange={(e) => setAddEnd(maskTime(e.target.value))}
                                                placeholder="จบ 12.00"
                                                maxLength={5}
                                                inputMode="numeric"
                                                className="px-2 py-1 border border-gray-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={handleAddEntry}
                                                disabled={loading || !addActivityId || !addStart || !addEnd}
                                                className="flex-1 py-1 text-[10px] bg-[#609279] text-white rounded hover:bg-[#4e7a64] disabled:opacity-50 font-medium"
                                            >
                                                เพิ่ม
                                            </button>
                                            <button
                                                onClick={() => { setAddingDay(null); setAddActivityId(""); setAddStart(""); setAddEnd(""); setAddCustomTitle(""); }}
                                                className="flex-1 py-1 text-[10px] bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingDay(dayIdx)}
                                        className="w-full py-1.5 border-2 border-dashed border-[#d1cce7]/30 rounded-lg text-[10px] text-[#3d405b]/30 hover:border-[#81b29a]/40 hover:text-[#609279] transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Plus size={10} />
                                        เพิ่มคลาส
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Booking Panel */}
            {selectedEntry && (
                <BookingPanel
                    entry={selectedEntry}
                    onClose={() => setSelectedEntry(null)}
                />
            )}
        </div>
    );
}
