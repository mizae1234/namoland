"use client";

import { useState } from "react";
import { reserveBook } from "@/actions/borrow";
import { Coins, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReserveButton({
    bookId,
    bookTitle,
    rentalCoins,
    hasEnoughCoins,
    hasActiveDeposit,
}: {
    bookId: string;
    bookTitle: string;
    rentalCoins: number;
    hasEnoughCoins: boolean;
    hasActiveDeposit?: boolean;
}) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string; code?: string } | null>(null);

    const handleReserve = async () => {
        setLoading(true);
        const res = await reserveBook(bookId);
        setResult(res);
        setLoading(false);
        if (res.success) {
            setTimeout(() => router.push("/user/books"), 2000);
        }
    };

    if (!hasEnoughCoins) {
        return (
            <div className="space-y-2">
                <div className="text-center py-3 bg-[#3d405b]/5 rounded-xl text-[#3d405b]/40 text-sm font-medium">
                    <AlertCircle size={18} className="inline mr-1.5" />
                    เหรียญไม่เพียงพอ
                </div>
                <a
                    href="/user/coins/top-up"
                    className="w-full py-3 bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white font-semibold rounded-xl shadow-lg shadow-[#a16b9f]/20 hover:from-[#81b29a] hover:to-[#a16b9f] transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Coins size={16} />
                    เติมเหรียญ
                </a>
            </div>
        );
    }

    if (result?.success) {
        return (
            <div className="text-center py-4 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 size={24} className="mx-auto mb-2" />
                <p className="font-semibold">จองสำเร็จ!</p>
                <p className="text-sm mt-1">รหัส: {result.code}</p>
                <p className="text-xs mt-2 text-emerald-500">กำลังกลับไปหน้ารายการ...</p>
            </div>
        );
    }

    if (result?.error) {
        return (
            <div className="text-center py-4 bg-red-50 rounded-xl text-red-600">
                <AlertCircle size={24} className="mx-auto mb-2" />
                <p className="font-semibold">{result.error}</p>
                <button onClick={() => setResult(null)} className="text-sm mt-2 underline">
                    ลองอีกครั้ง
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3.5 bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white font-semibold rounded-xl shadow-lg shadow-[#a16b9f]/20 hover:from-[#81b29a] hover:to-[#a16b9f] transition-all flex items-center justify-center gap-2"
            >
                <Coins size={18} />
                จองหนังสือ ({rentalCoins} เหรียญ)
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-[#3d405b] mb-2">ยืนยันจองหนังสือ?</h3>
                        <p className="text-sm text-[#3d405b]/60 mb-1">
                            <strong>{bookTitle}</strong>
                        </p>
                        <p className="text-sm text-[#3d405b]/50 mb-4">
                            หัก <span className="text-[#609279] font-semibold">{rentalCoins} เหรียญ</span> ทันที
                            {hasActiveDeposit
                                ? " (ไม่หักมัดจำเพิ่ม — มีมัดจำค้างอยู่แล้ว)"
                                : " (ค่ามัดจำจะหักเมื่อ Admin อนุมัติ)"
                            }
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm font-medium text-[#3d405b]/60 hover:bg-[#f4f1de]/50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleReserve}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#a16b9f]/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Coins size={14} />
                                        ยืนยัน
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
