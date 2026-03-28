"use client";

import { useState } from "react";
import { cancelReservation } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CancelReservationButton({ borrowId }: { borrowId: string }) {
    const t = useTranslations("UserBorrows.CancelButton");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");

    const handleCancel = async () => {
        setLoading(true);
        setError("");
        const result = await cancelReservation(borrowId);
        if (result.error) {
            setError(result.error);
            setLoading(false);
            setShowConfirm(false);
        } else {
            router.refresh();
        }
    };

    if (showConfirm) {
        return (
            <div className="mt-3 bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-600 font-medium mb-2">
                    {t("confirmMessage")}
                </p>
                {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                <div className="flex gap-2">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        {t("confirmBtn")}
                    </button>
                    <button
                        onClick={() => setShowConfirm(false)}
                        disabled={loading}
                        className="flex-1 py-2 border border-[#d1cce7]/30 text-[#3d405b]/60 rounded-lg text-xs font-medium hover:bg-[#f4f1de]/30 transition-colors disabled:opacity-50"
                    >
                        {t("cancelBtn")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors"
        >
            <XCircle size={13} />
            {t("triggerBtn")}
        </button>
    );
}
