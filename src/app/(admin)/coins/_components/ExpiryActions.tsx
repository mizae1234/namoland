"use client";

import { useState } from "react";
import { confirmExpiry, extendExpiry } from "@/actions/coin";
import { useRouter } from "next/navigation";

export default function ExpiryActions({ packageId }: { packageId: string }) {
    const router = useRouter();
    const [showExtend, setShowExtend] = useState(false);
    const [days, setDays] = useState("30");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirmExpiry = async () => {
        if (!confirm("ยืนยันตัดเหรียญหมดอายุ?")) return;
        setLoading(true);
        await confirmExpiry(packageId);
        setLoading(false);
        router.refresh();
    };

    const handleExtend = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("packageId", packageId);
        fd.set("days", days);
        fd.set("note", note);
        await extendExpiry(fd);
        setLoading(false);
        setShowExtend(false);
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
                <button
                    onClick={() => setShowExtend(!showExtend)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                    ขยายเวลา
                </button>
                <button
                    onClick={handleConfirmExpiry}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                >
                    ตัดเหรียญ
                </button>
            </div>

            {showExtend && (
                <div className="bg-slate-50 rounded-xl p-3 w-64 space-y-2">
                    <div>
                        <label className="text-xs text-slate-500">ขยายกี่วัน</label>
                        <input
                            type="number"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">หมายเหตุ</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
                    <button
                        onClick={handleExtend}
                        disabled={loading}
                        className="w-full py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600"
                    >
                        ยืนยันขยายเวลา
                    </button>
                </div>
            )}
        </div>
    );
}
