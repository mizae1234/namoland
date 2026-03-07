"use client";

import { useState } from "react";
import { returnBooks } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";

interface BookItem {
    id: string;
    bookId: string;
    book: { title: string; category: string | null };
}

interface ReturnBookFormProps {
    borrowId: string;
    items: BookItem[];
    dueDate: string;
    depositCoins: number;
    hasOtherBorrows: boolean;
    lateFeePreview: {
        lateDays: number;
        feeCoins: number;
        forfeitDeposit: boolean;
    };
}

export default function ReturnBookForm({ borrowId, items, dueDate, depositCoins, hasOtherBorrows, lateFeePreview }: ReturnBookFormProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [damagedItems, setDamagedItems] = useState<Map<string, number>>(new Map());
    const [result, setResult] = useState<{ success?: boolean; error?: string; lateFee?: number; damageFee?: number; forfeitDeposit?: boolean; depositReturned?: number } | null>(null);

    const toggleDamage = (itemId: string) => {
        setDamagedItems(prev => {
            const next = new Map(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.set(itemId, 1); // default 1 coin
            return next;
        });
    };

    const setDamageFee = (itemId: string, fee: number) => {
        setDamagedItems(prev => {
            const next = new Map(prev);
            next.set(itemId, Math.max(0, fee));
            return next;
        });
    };

    const totalDamageFee = Array.from(damagedItems.values()).reduce((s, v) => s + v, 0);

    const handleReturn = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("borrowId", borrowId);
        fd.set("damagedItems", JSON.stringify(Array.from(damagedItems.keys())));
        fd.set("customDamageFee", String(totalDamageFee));
        const res = await returnBooks(fd);
        setResult(res);
        setLoading(false);
        if (res.success) {
            setTimeout(() => router.refresh(), 2000);
        }
    };

    if (result?.success) {
        return (
            <Card className="mt-4 bg-emerald-50 border-emerald-200">
                <div className="text-center py-4">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-600" />
                    <p className="font-bold text-emerald-700 text-lg">คืนหนังสือสำเร็จ!</p>
                    <div className="mt-3 space-y-1 text-sm text-emerald-600">
                        {result.lateFee! > 0 && <p>ค่าปรับช้า: {result.lateFee} เหรียญ</p>}
                        {result.damageFee! > 0 && <p>ค่าเสียหาย: {result.damageFee} เหรียญ</p>}
                        {result.forfeitDeposit ? (
                            <p className="text-red-600 font-medium">ยึดมัดจำ {depositCoins} เหรียญ</p>
                        ) : result.depositReturned! > 0 ? (
                            <p>คืนมัดจำ: {result.depositReturned} เหรียญ</p>
                        ) : depositCoins > 0 ? (
                            <p className="text-amber-600">ยังไม่คืนมัดจำ (ยังมีหนังสือยืมค้างอยู่)</p>
                        ) : null}
                    </div>
                    <p className="text-xs text-emerald-500 mt-3">กำลังรีเฟรชหน้า...</p>
                </div>
            </Card>
        );
    }

    if (result?.error) {
        return (
            <Card className="mt-4 bg-red-50 border-red-200">
                <div className="text-center py-4">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
                    <p className="font-bold text-red-600">{result.error}</p>
                    <button onClick={() => setResult(null)} className="text-sm text-red-500 underline mt-2">ลองอีกครั้ง</button>
                </div>
            </Card>
        );
    }

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="mt-4 w-full py-3 bg-[#609279] text-white font-semibold rounded-xl shadow-md shadow-[#609279]/20 hover:bg-[#81b29a] transition-colors flex items-center justify-center gap-2"
            >
                <RotateCcw size={18} />
                คืนหนังสือ
            </button>
        );
    }

    const isLate = lateFeePreview.lateDays > 0;

    return (
        <Card className="mt-4">
            <h3 className="font-bold text-[#3d405b] mb-4 flex items-center gap-2">
                <RotateCcw size={16} className="text-[#609279]" />
                คืนหนังสือ
            </h3>

            {/* Late fee warning */}
            {isLate && (
                <div className={`rounded-xl p-3 mb-4 ${lateFeePreview.forfeitDeposit ? "bg-red-50" : "bg-amber-50"}`}>
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className={lateFeePreview.forfeitDeposit ? "text-red-500 mt-0.5" : "text-amber-500 mt-0.5"} />
                        <div>
                            <p className={`text-sm font-medium ${lateFeePreview.forfeitDeposit ? "text-red-600" : "text-amber-600"}`}>
                                คืนช้า {lateFeePreview.lateDays} วัน
                            </p>
                            {lateFeePreview.forfeitDeposit ? (
                                <p className="text-xs text-red-500 mt-0.5">
                                    เกิน 30 วัน → ยึดเงินมัดจำ {depositCoins} เหรียญ
                                </p>
                            ) : lateFeePreview.feeCoins > 0 ? (
                                <p className="text-xs text-amber-500 mt-0.5">
                                    ค่าปรับ: {lateFeePreview.feeCoins} เหรียญ
                                </p>
                            ) : (
                                <p className="text-xs text-emerald-500 mt-0.5">
                                    ไม่เกิน 5 วัน — ไม่มีค่าปรับ
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isLate && (
                <div className="rounded-xl p-3 mb-4 bg-emerald-50">
                    <p className="text-sm text-emerald-600 font-medium">✓ คืนตรงเวลา — ไม่มีค่าปรับ</p>
                </div>
            )}

            {/* Book items with damage checkbox */}
            <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-[#3d405b]/60 mb-2">ตรวจสอบสภาพหนังสือ:</p>
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`p-3 rounded-xl transition-colors ${damagedItems.has(item.id)
                            ? "bg-red-50 border-2 border-red-200"
                            : "bg-[#f4f1de]/30 border-2 border-transparent hover:border-[#d1cce7]/30"
                            }`}
                    >
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={damagedItems.has(item.id)}
                                onChange={() => toggleDamage(item.id)}
                                className="w-4 h-4 rounded border-[#d1cce7] text-red-500 focus:ring-red-200"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-[#3d405b]">{item.book.title}</p>
                                {item.book.category && (
                                    <p className="text-xs text-[#3d405b]/40">{item.book.category}</p>
                                )}
                            </div>
                            {damagedItems.has(item.id) && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                    ชำรุด
                                </span>
                            )}
                        </label>
                        {damagedItems.has(item.id) && (
                            <div className="mt-2 ml-7 flex items-center gap-2">
                                <label className="text-xs text-red-500">ค่าเสียหาย:</label>
                                <input
                                    type="number"
                                    value={damagedItems.get(item.id) ?? 1}
                                    onChange={(e) => setDamageFee(item.id, parseInt(e.target.value) || 0)}
                                    min="0"
                                    className="w-20 px-2 py-1 border border-red-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                                <span className="text-xs text-red-400">เหรียญ</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="bg-[#f4f1de]/50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                <p className="font-medium text-[#3d405b]">สรุป:</p>
                {lateFeePreview.feeCoins > 0 && !lateFeePreview.forfeitDeposit && (
                    <div className="flex justify-between text-amber-600">
                        <span>ค่าปรับช้า ({lateFeePreview.lateDays} วัน)</span>
                        <span className="font-medium">{lateFeePreview.feeCoins} เหรียญ</span>
                    </div>
                )}
                {damagedItems.size > 0 && (
                    <div className="flex justify-between text-red-600">
                        <span>ค่าเสียหาย ({damagedItems.size} เล่ม)</span>
                        <span className="font-medium">{totalDamageFee} เหรียญ</span>
                    </div>
                )}
                {lateFeePreview.forfeitDeposit ? (
                    <div className="flex justify-between text-red-600 font-medium">
                        <span>ยึดมัดจำ</span>
                        <span>{depositCoins} เหรียญ</span>
                    </div>
                ) : hasOtherBorrows ? (
                    <div className="flex justify-between text-amber-600">
                        <span>มัดจำ</span>
                        <span className="font-medium text-xs">ยังไม่คืน (ยังมีหนังสือยืมค้าง)</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-emerald-600">
                        <span>คืนมัดจำ</span>
                        <span className="font-medium">{depositCoins} เหรียญ</span>
                    </div>
                )}
            </div>

            {/* Late fee tiers reference */}
            <details className="mb-4">
                <summary className="text-xs text-[#3d405b]/40 cursor-pointer hover:text-[#3d405b]/60">
                    อัตราค่าปรับ
                </summary>
                <div className="mt-2 text-xs text-[#3d405b]/50 space-y-1 pl-3">
                    <p>• ≤ 5 วัน — ไม่มีค่าปรับ</p>
                    <p>• 6–15 วัน — 1 เหรียญ</p>
                    <p>• 16–30 วัน — 2 เหรียญ</p>
                    <p>• เกิน 30 วัน — ยึดเงินมัดจำ</p>
                </div>
            </details>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setShowForm(false); setDamagedItems(new Map()); }}
                    disabled={loading}
                    className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm font-medium text-[#3d405b]/60 hover:bg-[#f4f1de]/50 transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleReturn}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#609279]/20 hover:bg-[#81b29a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            <RotateCcw size={14} />
                            ยืนยันคืนหนังสือ
                        </>
                    )}
                </button>
            </div>
        </Card>
    );
}
