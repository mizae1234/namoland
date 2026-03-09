import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, Coins, XCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import CancelReservationButton from "./_components/CancelReservationButton";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string; bgClass: string }> = {
    RESERVED: { label: "รอ Admin อนุมัติ", icon: Clock, className: "text-[#a16b9f]", bgClass: "bg-[#a16b9f]/10" },
    BORROWED: { label: "กำลังยืม", icon: BookOpen, className: "text-[#609279]", bgClass: "bg-[#81b29a]/10" },
    RETURNED: { label: "คืนแล้ว", icon: CheckCircle2, className: "text-emerald-600", bgClass: "bg-emerald-50" },
    OVERDUE: { label: "เกินกำหนด", icon: AlertCircle, className: "text-red-500", bgClass: "bg-red-50" },
    FORFEITED: { label: "ยึดมัดจำ", icon: AlertCircle, className: "text-[#3d405b]/50", bgClass: "bg-[#3d405b]/5" },
    CANCELLED: { label: "ยกเลิก", icon: XCircle, className: "text-orange-500", bgClass: "bg-orange-50" },
};

export default async function UserBorrowHistoryPage() {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") redirect("/user/login");

    const borrowRecords = await prisma.borrowRecord.findMany({
        where: { userId: session.user.id },
        include: {
            items: { include: { book: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Group: active first, then completed
    const active = borrowRecords.filter(b => ["RESERVED", "BORROWED", "OVERDUE"].includes(b.status));
    const completed = borrowRecords.filter(b => ["RETURNED", "FORFEITED", "CANCELLED"].includes(b.status));

    return (
        <div className="p-4 pb-24">
            <h1 className="text-xl font-bold text-[#3d405b] mb-4">ประวัติยืม-คืน</h1>

            {borrowRecords.length === 0 ? (
                <div className="text-center py-16 text-[#3d405b]/40">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">ยังไม่มีประวัติการยืม</p>
                    <Link href="/user/books" className="text-sm text-[#609279] font-medium mt-2 inline-block">
                        ดูหนังสือ →
                    </Link>
                </div>
            ) : (
                <>
                    {/* Active */}
                    {active.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-[#3d405b]/60 mb-3">รายการที่กำลังดำเนินการ</h2>
                            <div className="space-y-3">
                                {active.map((record) => {
                                    const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.BORROWED;
                                    const StatusIcon = config.icon;
                                    const isOverdue = record.status === "BORROWED" && new Date(record.dueDate) < new Date();

                                    return (
                                        <div key={record.id} className="bg-white rounded-2xl border border-[#d1cce7]/20 overflow-hidden">
                                            {/* Header */}
                                            <div className={`px-4 py-3 flex items-center justify-between ${config.bgClass}`}>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon size={16} className={config.className} />
                                                    <span className={`text-sm font-medium ${config.className}`}>{config.label}</span>
                                                </div>
                                                <span className="text-xs text-[#3d405b]/40 font-mono">{record.code}</span>
                                            </div>

                                            {/* Books */}
                                            <div className="px-4 py-3">
                                                {record.items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 py-1.5">
                                                        <div className="w-8 h-8 bg-[#f4f1de] rounded-lg flex items-center justify-center shrink-0">
                                                            <BookOpen size={14} className="text-[#609279]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[#3d405b]">{item.book.title}</p>
                                                            {item.book.category && (
                                                                <p className="text-xs text-[#3d405b]/40">{item.book.category}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Dates */}
                                            <div className="px-4 py-3 bg-[#f4f1de]/30 border-t border-[#d1cce7]/10">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 text-[#3d405b]/50">
                                                        <Calendar size={12} />
                                                        <span>ยืม: {format(new Date(record.borrowDate), "d MMM yyyy", { locale: th })}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-medium ${isOverdue ? "text-red-500" : "text-[#3d405b]/60"}`}>
                                                        <Clock size={12} />
                                                        <span>กำหนดคืน: {format(new Date(record.dueDate), "d MMM yyyy", { locale: th })}</span>
                                                    </div>
                                                </div>
                                                {/* Coins */}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-[#3d405b]/40">
                                                    <span className="flex items-center gap-1">
                                                        <Coins size={11} />
                                                        ค่ายืม: {record.rentalCoins}
                                                    </span>
                                                    {record.depositCoins > 0 && (
                                                        <span>มัดจำ: {record.depositCoins}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cancel button for RESERVED */}
                                            {record.status === "RESERVED" && (
                                                <div className="px-4 pb-3">
                                                    <CancelReservationButton borrowId={record.id} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {completed.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-[#3d405b]/60 mb-3">ประวัติที่ผ่านมา</h2>
                            <div className="space-y-2.5">
                                {completed.map((record) => {
                                    const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.RETURNED;
                                    const StatusIcon = config.icon;

                                    return (
                                        <div key={record.id} className="bg-white rounded-xl p-4 border border-[#d1cce7]/20">
                                            {/* Title + Status */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    {record.items.map((item) => (
                                                        <p key={item.id} className="text-sm font-medium text-[#3d405b]/70">{item.book.title}</p>
                                                    ))}
                                                </div>
                                                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bgClass} ${config.className}`}>
                                                    <StatusIcon size={11} />
                                                    {config.label}
                                                </span>
                                            </div>

                                            {/* Dates */}
                                            <div className="grid grid-cols-2 gap-2 text-xs text-[#3d405b]/40">
                                                <div>
                                                    <span className="block">ยืม: {format(new Date(record.borrowDate), "d MMM yy", { locale: th })}</span>
                                                </div>
                                                <div>
                                                    <span className="block">กำหนดคืน: {format(new Date(record.dueDate), "d MMM yy", { locale: th })}</span>
                                                </div>
                                                {record.returnDate && (
                                                    <div className="col-span-2">
                                                        <span className="text-emerald-600 font-medium">
                                                            ✓ คืนเมื่อ: {format(new Date(record.returnDate), "d MMM yyyy เวลา HH:mm", { locale: th })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Coins Summary */}
                                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#d1cce7]/10 text-xs text-[#3d405b]/40">
                                                <span>ค่ายืม: {record.rentalCoins}</span>
                                                <span>มัดจำ: {record.depositCoins}</span>
                                                {record.lateFeeCoins > 0 && <span className="text-red-500">ค่าปรับ: {record.lateFeeCoins}</span>}
                                                {record.depositReturned && <span className="text-emerald-500">คืนมัดจำแล้ว</span>}
                                                {record.depositForfeited && <span className="text-red-500">ยึดมัดจำ</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
