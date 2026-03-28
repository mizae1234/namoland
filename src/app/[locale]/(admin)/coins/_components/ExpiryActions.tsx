"use client";

import { useState } from "react";
import { extendExpiry, deductCoins } from "@/actions/coin";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Modal from "@/components/ui/Modal";
import DateInput from "@/components/ui/DateInput";

interface ExpiryActionsProps {
    packageId: string;
    userId: string;
    remainingCoins: number;
    currentExpiry: string | null;
}

export default function ExpiryActions({ userId, remainingCoins, currentExpiry }: ExpiryActionsProps) {
    const router = useRouter();
    const [showExtend, setShowExtend] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmDeduct, setConfirmDeduct] = useState(false);

    // Extend state — date picker (same as member page)
    const currentDate = currentExpiry ? new Date(currentExpiry) : null;
    const [extendDate, setExtendDate] = useState(() => {
        if (currentDate) return format(currentDate, "yyyy-MM-dd");
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return format(d, "yyyy-MM-dd");
    });
    const [extendNote, setExtendNote] = useState("");

    const handleExtend = async () => {
        if (!extendDate) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", userId);
        fd.set("targetDate", extendDate);
        if (extendNote.trim()) fd.set("note", extendNote.trim());
        await extendExpiry(fd);
        setLoading(false);
        setShowExtend(false);
        setExtendNote("");
        router.refresh();
    };

    const handleDeductAll = async () => {
        setConfirmDeduct(false);
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", userId);
        fd.set("coinsToDeduct", String(remainingCoins));
        fd.set("reason", "เหรียญหมดอายุ — ตัดออก");
        await deductCoins(fd);
        setLoading(false);
        router.refresh();
    };

    return (
        <>
            <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowExtend(!showExtend)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-[#609279] text-white rounded-lg text-xs font-medium hover:bg-[#81b29a] disabled:opacity-50"
                    >
                        ขยายเวลา
                    </button>
                    <button
                        onClick={() => setConfirmDeduct(true)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                        ตัดเหรียญ
                    </button>
                </div>

                {showExtend && (
                    <div className="bg-[#f4f1de]/50 rounded-xl p-3 w-72 space-y-3">
                        {/* Current expiry */}
                        {currentDate && (
                            <div className="text-xs text-[#3d405b]/40">
                                หมดอายุปัจจุบัน: <span className="font-medium text-red-500">{format(currentDate, "d MMM yyyy", { locale: th })}</span>
                            </div>
                        )}

                        {/* Date picker */}
                        <div>
                            <label className="text-xs text-[#3d405b]/50 block mb-1">วันหมดอายุใหม่</label>
                            <DateInput
                                value={extendDate}
                                onChange={(val) => setExtendDate(val)}
                                min={format(new Date(), "yyyy-MM-dd")}
                                yearForward={3}
                            />
                        </div>

                        {/* Quick presets */}
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { label: "+30 วัน", days: 30 },
                                { label: "+60 วัน", days: 60 },
                                { label: "+90 วัน", days: 90 },
                            ].map((opt) => (
                                <button
                                    key={opt.days}
                                    type="button"
                                    onClick={() => {
                                        const base = currentDate || new Date();
                                        const d = new Date(base);
                                        d.setDate(d.getDate() + opt.days);
                                        setExtendDate(format(d, "yyyy-MM-dd"));
                                    }}
                                    className="px-2 py-1 rounded-full text-xs bg-[#f4f1de] text-[#3d405b]/60 hover:bg-[#a16b9f]/10 hover:text-[#a16b9f] transition-all"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Note */}
                        <div>
                            <label className="text-xs text-[#3d405b]/50 block mb-1">หมายเหตุ</label>
                            <input
                                type="text"
                                value={extendNote}
                                onChange={(e) => setExtendNote(e.target.value)}
                                placeholder="เหตุผล..."
                                className="w-full px-3 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm"
                            />
                        </div>

                        <button
                            onClick={handleExtend}
                            disabled={loading || !extendDate}
                            className="w-full py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {loading ? "กำลังดำเนินการ..." : "ยืนยันขยายเวลา"}
                        </button>
                    </div>
                )}
            </div>

            {/* Confirm Deduct Modal */}
            <Modal
                open={confirmDeduct}
                onClose={() => setConfirmDeduct(false)}
                title="ตัดเหรียญหมดอายุ"
                message={`ยืนยันต้องการตัดเหรียญ ${remainingCoins} เหรียญ ที่ใกล้หมดอายุ?`}
                confirmLabel="ตัดเหรียญ"
                onConfirm={handleDeductAll}
                loading={loading}
            />
        </>
    );
}
