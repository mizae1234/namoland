"use client";

import { useState } from "react";
import { updateBook, deleteBook } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { Trash2, Save, AlertTriangle, Clock } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintQrButton from "./PrintQrButton";

type BookData = {
    id: string;
    title: string;
    isbn: string | null;
    category: string | null;
    ageRange: string | null;
    qrCode: string;
    youtubeUrl: string | null;
    rentalCost: number;
    isAvailable: boolean;
    isActive: boolean;
    borrowItems: {
        id: string;
        isDamaged: boolean;
        borrowRecord: {
            code: string;
            status: string;
            borrowDate: string;
            dueDate: string;
            returnDate: string | null;
            user: { parentName: string };
        };
    }[];
};

export default function BookEditForm({ book }: { book: BookData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isActive, setIsActive] = useState(book.isActive);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const formData = new FormData(e.currentTarget);
        const result = await updateBook(book.id, formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess("บันทึกสำเร็จ!");
            setTimeout(() => setSuccess(""), 2000);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError("");

        const result = await deleteBook(book.id);

        if (result.error) {
            setError(result.error);
            setDeleting(false);
            setShowDeleteConfirm(false);
        } else {
            router.push("/books");
        }
    };

    const isBorrowed = book.borrowItems.some(
        (bi) => bi.borrowRecord.status === "BORROWED"
    );

    return (
        <div className="max-w-2xl">
            <BackLink href="/books" label="กลับไปหน้าหนังสือ" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#3d405b]">
                        แก้ไขหนังสือ
                    </h1>
                    <p className="text-sm text-[#3d405b]/40 font-mono mt-1">
                        {book.qrCode}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <PrintQrButton qrCode={book.qrCode} title={book.title} />
                    {!isActive && (
                        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#d1cce7]/25 text-[#3d405b]/70">
                            ปิดใช้งาน
                        </span>
                    )}
                    <span
                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${isBorrowed
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        {isBorrowed ? "ถูกยืม" : "ว่าง"}
                    </span>
                </div>
            </div>

            <AlertMessage message={error} />
            <AlertMessage type="success" message={success} />

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-[#d1cce7]/20 shadow-sm p-6 space-y-4"
            >
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        ชื่อหนังสือ *
                    </label>
                    <input
                        name="title"
                        type="text"
                        required
                        defaultValue={book.title}
                        className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                            ISBN
                        </label>
                        <input
                            name="isbn"
                            type="text"
                            defaultValue={book.isbn || ""}
                            className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                            หมวดหมู่
                        </label>
                        <input
                            name="category"
                            type="text"
                            defaultValue={book.category || ""}
                            className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                            placeholder="เช่น นิทาน, วิทยาศาสตร์"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        ช่วงอายุ
                    </label>
                    <input
                        name="ageRange"
                        type="text"
                        defaultValue={book.ageRange || ""}
                        className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                        placeholder="เช่น 3-6 ปี"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        YouTube URL
                    </label>
                    <input
                        name="youtubeUrl"
                        type="url"
                        defaultValue={book.youtubeUrl || ""}
                        className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                        placeholder="https://youtube.com/..."
                    />
                </div>

                {/* Rental Cost */}
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        ค่ายืม (เหรียญ)
                    </label>
                    <input
                        name="rentalCost"
                        type="number"
                        min="0"
                        defaultValue={book.rentalCost}
                        className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                        placeholder="1"
                    />
                </div>

                {/* Active/Inactive Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#f4f1de]/50 border border-[#d1cce7]/20">
                    <div>
                        <p className="text-sm font-medium text-[#3d405b]/80">สถานะหนังสือ</p>
                        <p className="text-xs text-[#3d405b]/40 mt-0.5">
                            {isActive ? "เปิดใช้งาน — แสดงในระบบ" : "ปิดใช้งาน — ซ่อนจากระบบ"}
                        </p>
                    </div>
                    <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
                    <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-[#3d405b]/30"}`}
                    >
                        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${isActive ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors border border-red-200"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </form>

            {/* Borrow History */}
            <Card className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-[#3d405b]/40" />
                    <h2 className="text-lg font-semibold text-[#3d405b]">
                        ประวัติการยืม ({book.borrowItems.length})
                    </h2>
                </div>
                {book.borrowItems.length === 0 ? (
                    <p className="text-sm text-[#3d405b]/40 text-center py-4">ยังไม่มีประวัติการยืม</p>
                ) : (
                    <div className="space-y-3">
                        {book.borrowItems.map((bi) => {
                            const borrowDate = new Date(bi.borrowRecord.borrowDate);
                            const dueDate = new Date(bi.borrowRecord.dueDate);
                            const returnDate = bi.borrowRecord.returnDate ? new Date(bi.borrowRecord.returnDate) : null;
                            const fmt = (d: Date) => d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

                            return (
                                <div
                                    key={bi.id}
                                    className="p-3 rounded-xl bg-[#f4f1de]/50 border border-[#d1cce7]/20"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-[#3d405b]/80">
                                                {bi.borrowRecord.user.parentName}
                                            </p>
                                            <p className="text-xs text-[#3d405b]/40 font-mono">
                                                {bi.borrowRecord.code}
                                            </p>
                                        </div>
                                        <StatusBadge status={bi.borrowRecord.status} />
                                    </div>
                                    <div className="flex gap-4 text-xs text-[#3d405b]/50">
                                        <span>📅 ยืม: {fmt(borrowDate)}</span>
                                        <span>⏰ กำหนดคืน: {fmt(dueDate)}</span>
                                        {returnDate && <span>✅ คืนจริง: {fmt(returnDate)}</span>}
                                    </div>
                                    {bi.isDamaged && (
                                        <p className="text-xs text-red-500 mt-1">⚠️ หนังสือเสียหาย</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#3d405b]">
                                ยืนยันการลบ
                            </h3>
                        </div>
                        <p className="text-sm text-[#3d405b]/50 mb-6">
                            ต้องการลบหนังสือ &quot;{book.title}&quot; ใช่หรือไม่?
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 bg-[#d1cce7]/15 hover:bg-[#d1cce7]/25 text-[#3d405b]/80 font-medium rounded-xl transition-colors text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                            >
                                {deleting ? "กำลังลบ..." : "ลบหนังสือ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
