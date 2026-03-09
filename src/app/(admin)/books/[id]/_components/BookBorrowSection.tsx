"use client";

import { useState, useCallback } from "react";
import { searchMembers } from "@/actions/member";
import { createBorrow } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { Search, User, BookOpen } from "lucide-react";
import { BORROW_DEPOSIT_COINS } from "@/lib/constants";

type Member = {
    id: string;
    parentName: string;
    phone: string;
    totalCoins: number;
};

export default function BookBorrowSection({ bookId, bookTitle, rentalCost }: { bookId: string; bookTitle: string; rentalCost: number }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const requiredCoins = BORROW_DEPOSIT_COINS + rentalCost;

    const handleSearch = useCallback(async (q: string) => {
        setQuery(q);
        setError("");
        if (q.length < 1) {
            setResults([]);
            return;
        }
        setSearching(true);
        const data = await searchMembers(q);
        setResults(data);
        setSearching(false);
    }, []);

    const handleSelectMember = (member: Member) => {
        setSelectedMember(member);
        setResults([]);
        setQuery("");
    };

    const handleBorrow = async () => {
        if (!selectedMember) return;
        setSubmitting(true);
        setError("");

        const fd = new FormData();
        fd.set("userId", selectedMember.id);
        fd.set("bookIds", JSON.stringify([bookId]));

        const result = await createBorrow(fd);
        if (result.error) {
            setError(result.error);
            setSubmitting(false);
        } else {
            setSuccess("ยืมหนังสือสำเร็จ!");
            setTimeout(() => router.push("/borrows"), 1500);
        }
    };

    return (
        <div className="mt-6 bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-[#609279]" />
                <h2 className="text-lg font-semibold text-[#3d405b]">ให้ยืมหนังสือเล่มนี้</h2>
            </div>

            {/* Cost Preview */}
            <div className="bg-[#81b29a]/10 rounded-xl p-3 mb-4 border border-[#81b29a]/20 text-sm text-[#609279]">
                <span>ค่ามัดจำ: {BORROW_DEPOSIT_COINS} เหรียญ</span>
                <span className="mx-2">·</span>
                <span>ค่าเช่า: {rentalCost} เหรียญ</span>
                <span className="mx-2">·</span>
                <span className="font-bold">รวม: {requiredCoins} เหรียญ</span>
            </div>

            {/* Member Search */}
            {!selectedMember ? (
                <div>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="ค้นหาสมาชิก (ชื่อ หรือ เบอร์โทร)"
                            className="w-full pl-10 pr-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] outline-none text-sm"
                        />
                    </div>

                    {searching && (
                        <div className="text-center py-3 text-[#3d405b]/40 text-sm">กำลังค้นหา...</div>
                    )}

                    {results.length > 0 && (
                        <div className="mt-2 border border-[#d1cce7]/20 rounded-xl overflow-hidden divide-y divide-[#d1cce7]/15">
                            {results.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectMember(m)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f4f1de]/50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 bg-[#81b29a]/15 rounded-lg flex items-center justify-center">
                                        <User size={16} className="text-[#609279]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#3d405b]/80">{m.parentName}</p>
                                        <p className="text-xs text-[#3d405b]/40">{m.phone}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.totalCoins >= requiredCoins
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-600"
                                        }`}>
                                        {m.totalCoins} เหรียญ
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {query.length >= 1 && !searching && results.length === 0 && (
                        <p className="text-sm text-[#3d405b]/40 text-center py-3">ไม่พบสมาชิก</p>
                    )}
                </div>
            ) : (
                /* Selected Member */
                <div>
                    <div className="flex items-center gap-3 p-4 bg-[#f4f1de]/50 rounded-xl border border-[#d1cce7]/20 mb-4">
                        <div className="w-10 h-10 bg-[#81b29a]/15 rounded-xl flex items-center justify-center">
                            <User size={20} className="text-[#609279]" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-[#3d405b]">{selectedMember.parentName}</p>
                            <p className="text-xs text-[#3d405b]/40">{selectedMember.phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[#3d405b]/40">เหรียญคงเหลือ</p>
                            <p className={`font-bold ${selectedMember.totalCoins >= requiredCoins ? "text-emerald-600" : "text-red-500"}`}>
                                {selectedMember.totalCoins}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="text-xs text-[#3d405b]/40 hover:text-red-500 ml-2"
                        >
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-600">
                            {success}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleBorrow}
                            disabled={submitting || selectedMember.totalCoins < requiredCoins}
                            className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4a7a5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? "กำลังบันทึก..."
                                : selectedMember.totalCoins < requiredCoins
                                    ? `เหรียญไม่เพียงพอ (ต้องการ ${requiredCoins})`
                                    : `ยืนยันยืม "${bookTitle}" (หัก ${requiredCoins} เหรียญ)`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
