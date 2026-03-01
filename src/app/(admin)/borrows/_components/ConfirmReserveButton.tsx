"use client";

import { useState } from "react";
import { confirmReservation } from "@/actions/borrow";
import { useRouter } from "next/navigation";

export default function ConfirmReserveButton({ borrowId }: { borrowId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (loading) return;
        if (!confirm("ยืนยันรับหนังสือ? สถานะจะเปลี่ยนเป็น 'กำลังยืม'")) return;

        setLoading(true);
        const result = await confirmReservation(borrowId);

        if (result.error) {
            alert(result.error);
            setLoading(false);
        } else {
            router.refresh();
        }
    };

    return (
        <button
            onClick={handleConfirm}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
            {loading ? "..." : "ยืนยันรับ"}
        </button>
    );
}
