"use client";

import { useState } from "react";
import { returnBooks } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface BookReturnSectionProps {
    bookId: string;
    bookTitle: string;
    borrowItemId: string;
    borrowRecordId: string;
    borrowerName: string;
    borrowCode: string;
    dueDate: string;
    lateFeePreview: {
        lateDays: number;
        feeCoins: number;
        forfeitDeposit: boolean;
    };
    totalItems: number;
}

export default function BookReturnSection({
    bookTitle,
    borrowItemId,
    borrowRecordId,
    borrowerName,
    borrowCode,
    lateFeePreview,
    totalItems,
}: BookReturnSectionProps) {
    const t = useTranslations("AdminBooks.detail.return");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string; isFullReturn?: boolean; remainingCount?: number } | null>(null);

    const handleReturn = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("borrowId", borrowRecordId);
        fd.set("returnItemIds", JSON.stringify([borrowItemId]));
        fd.set("damagedItems", "[]");
        fd.set("customDamageFee", "0");
        const res = await returnBooks(fd);
        setResult(res);
        setLoading(false);
        if (res.success) {
            setTimeout(() => router.refresh(), 2000);
        }
    };

    if (result?.success) {
        return (
            <div className="mt-6 bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <div className="text-center">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600" />
                    <p className="font-bold text-emerald-700">{t("success", { title: bookTitle })}</p>
                    {(result.remainingCount ?? 0) > 0 && (
                        <p className="text-sm text-amber-600 mt-1">{t("remaining", { count: result.remainingCount ?? 0 })}</p>
                    )}
                    <p className="text-xs text-emerald-500 mt-2">{t("refreshing")}</p>
                </div>
            </div>
        );
    }

    if (result?.error) {
        return (
            <div className="mt-6 bg-red-50 rounded-2xl border border-red-200 p-6">
                <div className="text-center">
                    <AlertTriangle size={28} className="mx-auto mb-2 text-red-500" />
                    <p className="font-bold text-red-600">{result.error}</p>
                    <button onClick={() => setResult(null)} className="text-sm text-red-500 underline mt-2">{t("tryAgain")}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 bg-white rounded-2xl border border-amber-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
                <RotateCcw size={18} className="text-amber-600" />
                <h2 className="text-lg font-semibold text-[#3d405b]">{t("borrowedStatus")}</h2>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-amber-700">
                    <User size={14} />
                    <span>{t("borrower")} <strong>{borrowerName}</strong></span>
                </div>
                <p className="text-xs text-amber-600 mt-1">{t("borrowCode", { code: borrowCode, total: totalItems })}</p>
                {lateFeePreview.lateDays > 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                        {t("lateNotice", { days: lateFeePreview.lateDays })}
                    </p>
                )}
            </div>

            {!confirm ? (
                <button
                    onClick={() => setConfirm(true)}
                    className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5"
                >
                    <RotateCcw size={14} />
                    {t("returnBtn")}
                </button>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-[#3d405b]/60 text-center">{t("confirmText", { title: bookTitle })}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirm(false)}
                            disabled={loading}
                            className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm font-medium text-[#3d405b]/60 hover:bg-[#f4f1de]/50 transition-colors disabled:opacity-50"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleReturn}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-semibold shadow-md hover:bg-[#81b29a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    {t("confirmAction")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
