"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarCheck, Check, Clock, XCircle, Ban, RefreshCw, Coins } from "lucide-react";
import Card from "@/components/ui/Card";

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

const DAY_LABELS: Record<number, string> = {
    0: "อาทิตย์", 1: "จันทร์", 2: "อังคาร", 3: "พุธ",
    4: "พฤหัส", 5: "ศุกร์", 6: "เสาร์",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    CHECKED_IN: { label: "เข้าเรียนแล้ว", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: <Check size={12} /> },
    BOOKED: { label: "จองแล้ว", color: "text-amber-700", bgColor: "bg-amber-100", icon: <Clock size={12} /> },
    CANCELLED: { label: "ยกเลิก", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle size={12} /> },
    NO_SHOW: { label: "ไม่มาเรียน", color: "text-gray-600", bgColor: "bg-gray-100", icon: <Ban size={12} /> },
};

async function fetchBookings(userId: string): Promise<BookingRecord[]> {
    const res = await fetch(`/api/members/${userId}/bookings`);
    if (!res.ok) return [];
    return res.json();
}

export default function MemberBookingHistory({ userId }: { userId: string }) {
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isPending, startTransition] = useTransition();
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState<string>("ALL");

    function loadBookings() {
        startTransition(async () => {
            const data = await fetchBookings(userId);
            setBookings(data);
            setLoaded(true);
        });
    }

    const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

    // Summary counts
    const total = bookings.length;
    const checkedIn = bookings.filter(b => b.status === "CHECKED_IN").length;
    const booked = bookings.filter(b => b.status === "BOOKED").length;
    const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
    const totalCoins = bookings.reduce((s, b) => s + b.coinsCharged, 0);

    return (
        <Card padding={false} className="mb-6">
            <div className="p-6 border-b border-[#d1cce7]/20 flex items-center justify-between">
                <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                    <CalendarCheck size={18} className="text-blue-500" />
                    ประวัติการจองและเข้าคลาส
                </h2>
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
                    {loaded ? "รีเฟรช" : "โหลดข้อมูล"}
                </button>
            </div>

            {!loaded && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <CalendarCheck size={32} className="mx-auto mb-2 opacity-40" />
                    <p>กดปุ่ม &quot;โหลดข้อมูล&quot; เพื่อดูประวัติ</p>
                </div>
            )}

            {loaded && bookings.length === 0 && (
                <div className="p-8 text-center text-[#3d405b]/30 text-sm">
                    <p>ยังไม่มีประวัติการจองคลาส</p>
                </div>
            )}

            {loaded && bookings.length > 0 && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-5 gap-3 p-4 border-b border-[#d1cce7]/20">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-blue-600/60 mb-1">ทั้งหมด</p>
                            <p className="text-lg font-bold text-blue-600">{total}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-emerald-600/60 mb-1">เข้าเรียน</p>
                            <p className="text-lg font-bold text-emerald-600">{checkedIn}</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-amber-600/60 mb-1">จองอยู่</p>
                            <p className="text-lg font-bold text-amber-600">{booked}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-red-500/60 mb-1">ยกเลิก</p>
                            <p className="text-lg font-bold text-red-500">{cancelled}</p>
                        </div>
                        <div className="bg-[#f4f1de] rounded-xl p-3 text-center">
                            <p className="text-xs text-[#3d405b]/40 mb-1">เหรียญใช้ไป</p>
                            <p className="text-lg font-bold text-[#609279] flex items-center justify-center gap-1">
                                <Coins size={14} /> {totalCoins}
                            </p>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="px-4 py-3 border-b border-[#d1cce7]/10 flex gap-1.5">
                        {([["ALL", "ทั้งหมด"], ["CHECKED_IN", "เข้าเรียน"], ["BOOKED", "จองอยู่"], ["CANCELLED", "ยกเลิก"], ["NO_SHOW", "ไม่มา"]] as [string, string][]).map(([val, label]) => (
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/30">
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">วันที่จอง</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">คลาส</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">ผู้เข้าเรียน</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">วัน/เวลา</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">สถานะ</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">เหรียญ</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">Check-in</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-[#3d405b]/70 text-xs">จองโดย</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => {
                                    const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.BOOKED;
                                    return (
                                        <tr key={b.id} className="border-b border-[#d1cce7]/10 hover:bg-[#f4f1de]/20 transition-colors">
                                            <td className="px-3 py-2.5 text-[#3d405b]/70 whitespace-nowrap text-xs">
                                                {format(new Date(b.createdAt), "d MMM yy", { locale: th })}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b] font-medium text-xs max-w-[200px] truncate">
                                                {b.className}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/60 text-xs">
                                                {b.childName || "-"}
                                            </td>
                                            <td className="px-3 py-2.5 text-[#3d405b]/50 whitespace-nowrap text-xs">
                                                {DAY_LABELS[b.dayOfWeek]} {b.startTime}-{b.endTime}
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
                                                    ? format(new Date(b.checkedInAt), "HH:mm", { locale: th })
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
                        แสดง {filtered.length} จาก {total} รายการ
                    </div>
                </>
            )}
        </Card>
    );
}
