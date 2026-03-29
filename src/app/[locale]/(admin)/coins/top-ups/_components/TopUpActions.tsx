"use client";

import { useState } from "react";
import { processTopUp } from "@/actions/coin";
import { Check, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";

interface TopUpActionsProps {
    requestId: string;
}

export default function TopUpActions({ requestId }: TopUpActionsProps) {
    const t = useTranslations("AdminCoins.actions");
    const [loading, setLoading] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [note, setNote] = useState("");
    const [done, setDone] = useState<string | null>(null);
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const handleAction = async (action: "APPROVED" | "REJECTED") => {
        setLoading(true);
        const result = await processTopUp(requestId, action, note || undefined);
        if (result.error) {
            setErrorModal(result.error);
            setLoading(false);
        } else {
            setDone(action);
            setLoading(false);
        }
    };

    if (done) {
        return (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${done === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                {done === "APPROVED" ? t("approvedLabel") : t("rejectedLabel")}
            </span>
        );
    }

    if (showReject) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("notePlaceholder")}
                    className="px-2 py-1 text-xs border border-[#d1cce7]/30 rounded-lg w-32"
                />
                <button
                    onClick={() => handleAction("REJECTED")}
                    disabled={loading}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                    {t("confirmBtn")}
                </button>
                <button
                    onClick={() => setShowReject(false)}
                    className="px-2 py-1 text-xs text-[#3d405b]/50 hover:text-[#3d405b]/80"
                >
                    {t("cancelBtn")}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleAction("APPROVED")}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                    <Check size={14} />
                    {t("approveBtn")}
                </button>
                <button
                    onClick={() => setShowReject(true)}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                    <X size={14} />
                    {t("rejectBtn")}
                </button>
            </div>

            {/* Error Alert */}
            <Modal
                open={!!errorModal}
                onClose={() => setErrorModal(null)}
                title={t("errorTitle")}
                message={errorModal || ""}
                variant="error"
            />
        </>
    );
}
