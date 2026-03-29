"use client";

import { useState } from "react";
import { reserveBook } from "@/actions/borrow";
import { ShoppingCart, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ReserveButton({ bookId }: { bookId: string }) {
    const t = useTranslations("BookQrLanding.reserveBtn");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleReserve = async () => {
        if (loading || success) return;
        setLoading(true);
        setError("");

        const result = await reserveBook(bookId);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => router.push("/user"), 2000);
        }
    };

    if (success) {
        return (
            <div className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-medium rounded-xl">
                <Check size={20} />
                {t("success")}
            </div>
        );
    }

    return (
        <div>
            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs text-center">
                    {error}
                </div>
            )}
            <button
                onClick={handleReserve}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50"
            >
                <ShoppingCart size={20} />
                {loading ? t("booking") : t("action")}
            </button>
        </div>
    );
}
