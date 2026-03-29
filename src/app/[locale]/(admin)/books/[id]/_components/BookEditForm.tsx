"use client";

import { useState, useRef } from "react";
import { updateBook, deleteBook } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { Trash2, Save, AlertTriangle, Clock, ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import PrintQrButton from "./PrintQrButton";
import { useTranslations, useLocale } from "next-intl";

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
    coverImage: string | null;
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
    const t = useTranslations("AdminBooks.detail");
    const localeStr = useLocale();
    const isThai = localeStr === "th";

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isActive, setIsActive] = useState(book.isActive);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "bookCover");
            formData.append("bookId", book.id);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(t("form.uploadError"));

            router.refresh();
            setSuccess(t("form.uploadSuccess"));
            setTimeout(() => setSuccess(""), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("form.errorMsg"));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveImage = async () => {
        setUploading(true);
        try {
            const res = await fetch(`/api/upload?type=bookCover&bookId=${book.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(t("form.deleteError"));
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("form.errorMsg"));
        } finally {
            setUploading(false);
        }
    };

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
            setSuccess(t("form.saveSuccess"));
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
            <BackLink href="/books" label={t("backToBooks")} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#3d405b]">
                        {t("editBook")}
                    </h1>
                    <p className="text-sm text-[#3d405b]/40 font-mono mt-1">
                        {book.qrCode}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <PrintQrButton qrCode={book.qrCode} title={book.title} />
                    {!isActive && (
                        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#d1cce7]/25 text-[#3d405b]/70">
                            {t("status.inactive")}
                        </span>
                    )}
                    <span
                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${isBorrowed
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        {isBorrowed ? t("status.borrowed") : t("status.available")}
                    </span>
                </div>
            </div>

            <AlertMessage message={error} />
            <AlertMessage type="success" message={success} />

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-[#d1cce7]/20 shadow-sm p-6 space-y-4"
            >
                {/* Book Cover Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        {t("form.coverImage")}
                    </label>
                    <div className="flex gap-4 items-start">
                        <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-dashed border-[#d1cce7]/50 bg-[#f4f1de]/30 flex flex-col items-center justify-center flex-shrink-0">
                            {book.coverImage ? (
                                <>
                                    <Image
                                        src={book.coverImage}
                                        alt={book.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            disabled={uploading}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon size={24} className="text-[#3d405b]/20 mx-auto mb-1" />
                                    <span className="text-[10px] text-[#3d405b]/40">{t("form.noImage")}</span>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <span className="text-xs font-medium text-[#609279] animate-pulse">{t("form.loading")}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4f1de]/50 hover:bg-[#d1cce7]/20 border border-[#d1cce7]/30 text-[#3d405b]/70 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Upload size={16} />
                                {book.coverImage ? t("form.changeImage") : t("form.uploadImage")}
                            </button>
                            <p className="text-xs text-[#3d405b]/40 mt-2 whitespace-pre-line">
                                {t("form.imageHelpText")}<br />
                                {t("form.imageHelpDesc")}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        {t("form.title")}
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
                            {t("form.category")}
                        </label>
                        <input
                            name="category"
                            type="text"
                            defaultValue={book.category || ""}
                            className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                            placeholder={t("form.categoryPlaceholder")}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        {t("form.ageRange")}
                    </label>
                    <input
                        name="ageRange"
                        type="text"
                        defaultValue={book.ageRange || ""}
                        className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                        placeholder={t("form.ageRangePlaceholder")}
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
                        {t("form.rentalCost")}
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
                        <p className="text-sm font-medium text-[#3d405b]/80">{t("form.bookStatus")}</p>
                        <p className="text-xs text-[#3d405b]/40 mt-0.5">
                            {isActive ? t("status.activeDesc") : t("status.inactiveDesc")}
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
                        {loading ? t("form.saving") : t("form.save")}
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
                        {t("borrowHistory.title", { count: book.borrowItems.length })}
                    </h2>
                </div>
                {book.borrowItems.length === 0 ? (
                    <p className="text-sm text-[#3d405b]/40 text-center py-4">{t("borrowHistory.empty")}</p>
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
                                        <span>📅 {t("borrowHistory.borrowedOn")} {fmt(borrowDate)}</span>
                                        <span>⏰ {t("borrowHistory.dueOn")} {fmt(dueDate)}</span>
                                        {returnDate && <span>✅ {t("borrowHistory.returnedOn")} {fmt(returnDate)}</span>}
                                    </div>
                                    {bi.isDamaged && (
                                        <p className="text-xs text-red-500 mt-1">{t("borrowHistory.damaged")}</p>
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
                                {t("deleteModal.title")}
                            </h3>
                        </div>
                        <p className="text-sm text-[#3d405b]/50 mb-6 whitespace-pre-line">
                            {t("deleteModal.desc", { title: book.title })}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2.5 bg-[#d1cce7]/15 hover:bg-[#d1cce7]/25 text-[#3d405b]/80 font-medium rounded-xl transition-colors text-sm"
                            >
                                {t("deleteModal.cancel")}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                            >
                                {deleting ? t("deleteModal.deleting") : t("deleteModal.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
