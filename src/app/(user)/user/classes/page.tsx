import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CalendarDays, Check, Clock, XCircle, Ban, Coins } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; Icon: typeof Check }> = {
    BOOKED: { label: "จองแล้ว", color: "text-blue-600", bgColor: "bg-blue-50", Icon: Clock },
    CHECKED_IN: { label: "เข้าเรียนแล้ว", color: "text-emerald-600", bgColor: "bg-emerald-50", Icon: Check },
    CANCELLED: { label: "ยกเลิก", color: "text-gray-400", bgColor: "bg-gray-50", Icon: XCircle },
    NO_SHOW: { label: "ไม่มาเรียน", color: "text-red-500", bgColor: "bg-red-50", Icon: Ban },
};

const DAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];

export default async function UserClassesPage() {
    const session = await auth();
    const userId = session!.user.id;

    const bookings = await prisma.classBooking.findMany({
        where: { userId },
        include: {
            classEntry: {
                include: {
                    schedule: { select: { startDate: true, endDate: true, theme: true } },
                },
            },
            child: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // Group by status
    const upcoming = bookings.filter((b) => b.status === "BOOKED");
    const past = bookings.filter((b) => b.status !== "BOOKED");

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Link href="/user" className="text-[#3d405b]/40 hover:text-[#3d405b] text-sm">← กลับ</Link>
            </div>
            <h1 className="text-xl font-bold text-[#3d405b] mb-1 flex items-center gap-2">
                <CalendarDays size={22} className="text-[#a16b9f]" />
                ประวัติจองคลาส
            </h1>
            <p className="text-xs text-[#3d405b]/40 mb-6">ดูรายการจองคลาสทั้งหมดของคุณ</p>

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                        <Clock size={14} />
                        รอเข้าเรียน ({upcoming.length})
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map((b) => (
                            <BookingCard key={b.id} booking={b} />
                        ))}
                    </div>
                </div>
            )}

            {/* History */}
            <div>
                <h2 className="text-sm font-bold text-[#3d405b]/50 mb-3">ประวัติ</h2>
                {past.length === 0 && upcoming.length === 0 ? (
                    <div className="text-center py-10">
                        <CalendarDays size={40} className="mx-auto text-[#3d405b]/10 mb-3" />
                        <p className="text-sm text-[#3d405b]/30">ยังไม่มีประวัติจองคลาส</p>
                    </div>
                ) : past.length === 0 ? (
                    <p className="text-xs text-[#3d405b]/30 text-center py-4">ยังไม่มีประวัติ</p>
                ) : (
                    <div className="space-y-2">
                        {past.map((b) => (
                            <BookingCard key={b.id} booking={b} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BookingCard({ booking: b }: { booking: any }) {
    const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.BOOKED;
    const Icon = status.Icon;
    const scheduleDate = b.classEntry.schedule.startDate
        ? format(new Date(b.classEntry.schedule.startDate), "d MMM yy", { locale: th })
        : "";

    return (
        <div className={`rounded-xl p-3 border border-[#d1cce7]/15 ${b.status === "BOOKED" ? "bg-white" : "bg-gray-50/50"}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#3d405b] truncate">{b.classEntry.title}</p>
                    <p className="text-xs text-[#3d405b]/40 mt-0.5">
                        {DAY_LABELS[b.classEntry.dayOfWeek]} {b.classEntry.startTime}-{b.classEntry.endTime}
                    </p>
                    <p className="text-[10px] text-[#3d405b]/30 mt-0.5">
                        สัปดาห์ {scheduleDate}
                        {b.classEntry.schedule.theme && ` • ${b.classEntry.schedule.theme}`}
                    </p>
                    {b.child && (
                        <p className="text-[10px] text-[#a16b9f]/60 mt-0.5">บุตร: {b.child.name}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`${status.bgColor} ${status.color} px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1`}>
                        <Icon size={10} />
                        {status.label}
                    </span>
                    {b.coinsCharged > 0 && b.status === "CHECKED_IN" && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <Coins size={9} /> -{b.coinsCharged}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
