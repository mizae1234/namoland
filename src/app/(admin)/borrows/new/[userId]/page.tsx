"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMemberById } from "@/actions/member";
import { createBorrow, getBooks } from "@/actions/borrow";
import { Check, BookOpen } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";

type Member = NonNullable<Awaited<ReturnType<typeof getMemberById>>>;
type Book = Awaited<ReturnType<typeof getBooks>>[number];

export default function NewBorrowPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [member, setMember] = useState<Member | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
            const [m, b] = await Promise.all([
                getMemberById(userId),
                getBooks(),
            ]);
            setMember(m);
            setBooks(b.filter((book) => book.isAvailable));
            setLoading(false);
        }
        loadData();
    }, [userId]);

    const toggleBook = (bookId: string) => {
        if (selectedBooks.includes(bookId)) {
            setSelectedBooks(selectedBooks.filter((id) => id !== bookId));
        } else if (selectedBooks.length < 5) {
            setSelectedBooks([...selectedBooks, bookId]);
        }
    };

    const handleSubmit = async () => {
        if (selectedBooks.length === 0) return;
        setSubmitting(true);
        setError("");

        const fd = new FormData();
        fd.set("userId", userId);
        fd.set("bookIds", JSON.stringify(selectedBooks));

        const result = await createBorrow(fd);
        if (result.error) {
            setError(result.error);
            setSubmitting(false);
        } else {
            router.push("/borrows");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#609279] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!member) {
        return <div className="text-center py-20 text-[#3d405b]/40">ไม่พบสมาชิก</div>;
    }

    const totalCoins = member.coinPackages
        .filter((p) => !p.isExpired && p.remainingCoins > 0)
        .reduce((s, p) => s + p.remainingCoins, 0);

    return (
        <div className="max-w-3xl">
            <BackLink href="/borrows/scan" label="กลับ" />

            <h1 className="text-2xl font-bold text-[#3d405b] mb-2">ยืมหนังสือ</h1>
            <p className="text-[#3d405b]/50 mb-6">
                สมาชิก: <span className="font-medium text-[#3d405b]/80">{member.parentName}</span>
                {" · "}เหรียญคงเหลือ: <span className="font-semibold text-emerald-600">{totalCoins}</span>
            </p>

            <AlertMessage message={error} />

            {/* Cost Preview */}
            <div className="bg-[#81b29a]/10 rounded-2xl p-4 mb-6 border border-[#81b29a]/20">
                <p className="text-sm font-medium text-[#609279]">ค่าใช้จ่าย</p>
                <div className="flex gap-6 mt-2 text-sm text-[#609279]">
                    <span>ค่ามัดจำ: 5 เหรียญ</span>
                    <span>ค่าเช่า: 1 เหรียญ</span>
                    <span className="font-bold">รวม: 6 เหรียญ</span>
                </div>
                <p className="text-xs text-[#81b29a] mt-1">ระยะเวลายืม 14 วัน · สูงสุด 5 เล่ม</p>
            </div>

            {/* Book Selection */}
            <Card className="mb-6">
                <h2 className="font-semibold text-[#3d405b] mb-4">
                    เลือกหนังสือ ({selectedBooks.length}/5)
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {books.length === 0 ? (
                        <p className="text-[#3d405b]/40 text-sm text-center py-4">ไม่มีหนังสือที่ว่าง</p>
                    ) : (
                        books.map((book) => {
                            const isSelected = selectedBooks.includes(book.id);
                            return (
                                <button
                                    key={book.id}
                                    onClick={() => toggleBook(book.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? "border-[#81b29a] bg-[#81b29a]/10"
                                        : "border-[#d1cce7]/20 hover:border-[#81b29a]/30 hover:bg-[#f4f1de]/50"
                                        }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#609279]" : "bg-[#d1cce7]/25"
                                            }`}
                                    >
                                        {isSelected && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#3d405b]/80">{book.title}</p>
                                        {book.category && (
                                            <p className="text-xs text-[#3d405b]/40">{book.category}</p>
                                        )}
                                    </div>
                                    <BookOpen size={16} className="text-[#3d405b]/30" />
                                </button>
                            );
                        })
                    )}
                </div>
            </Card>

            <button
                onClick={handleSubmit}
                disabled={submitting || selectedBooks.length === 0 || totalCoins < 6}
                className="w-full py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting
                    ? "กำลังบันทึก..."
                    : totalCoins < 6
                        ? "เหรียญไม่เพียงพอ"
                        : `ยืนยันยืม ${selectedBooks.length} เล่ม (หัก 6 เหรียญ)`}
            </button>
        </div>
    );
}
