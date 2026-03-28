"use client";

import { useState } from "react";
import { confirmReservation, rejectReservation } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function ConfirmReserveButton({ borrowId, hasActiveDeposit }: { borrowId: string; hasActiveDeposit?: boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
    const [confirmModal, setConfirmModal] = useState<"approve" | "reject" | null>(null);
    const [errorModal, setErrorModal] = useState<string | null>(null);

    const handleConfirm = async () => {
        setConfirmModal(null);
        setLoading("approve");
        const result = await confirmReservation(borrowId);

        if (result.error) {
            setErrorModal(result.error);
            setLoading(null);
        } else {
            router.refresh();
        }
    };

    const handleReject = async () => {
        setConfirmModal(null);
        setLoading("reject");
        const result = await rejectReservation(borrowId);

        if (result.error) {
            setErrorModal(result.error);
            setLoading(null);
        } else {
            router.refresh();
        }
    };

    return (
        <>
            <div className="flex gap-1.5">
                <button
                    onClick={() => setConfirmModal("approve")}
                    disabled={!!loading}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#609279] hover:bg-[#81b29a] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {loading === "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    อนุมัติ
                </button>
                <button
                    onClick={() => setConfirmModal("reject")}
                    disabled={!!loading}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {loading === "reject" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    ปฏิเสธ
                </button>
            </div>

            {/* Approve Confirmation */}
            <Modal
                open={confirmModal === "approve"}
                onClose={() => setConfirmModal(null)}
                title="ยืนยันอนุมัติ?"
                message={hasActiveDeposit
                    ? "ไม่หักมัดจำเพิ่ม (มีมัดจำค้างอยู่แล้ว)"
                    : "ค่ามัดจำ 5 เหรียญจะถูกหักจากสมาชิก"
                }
                confirmLabel="อนุมัติ"
                onConfirm={handleConfirm}
                loading={!!loading}
            />

            {/* Reject Confirmation */}
            <Modal
                open={confirmModal === "reject"}
                onClose={() => setConfirmModal(null)}
                title="ปฏิเสธการจอง?"
                message="ค่ายืม 1 เหรียญจะถูกคืนให้สมาชิก"
                confirmLabel="ปฏิเสธ"
                onConfirm={handleReject}
                loading={!!loading}
            />

            {/* Error Alert */}
            <Modal
                open={!!errorModal}
                onClose={() => setErrorModal(null)}
                title="เกิดข้อผิดพลาด"
                message={errorModal || ""}
                variant="error"
            />
        </>
    );
}
