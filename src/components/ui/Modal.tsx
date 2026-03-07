"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    children?: ReactNode;
    variant?: "confirm" | "alert" | "error";
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    loading?: boolean;
}

export default function Modal({
    open,
    onClose,
    title,
    message,
    children,
    variant = "confirm",
    confirmLabel = "ยืนยัน",
    cancelLabel = "ยกเลิก",
    onConfirm,
    loading,
}: ModalProps) {
    if (!open) return null;

    const isError = variant === "error";
    const isAlert = variant === "alert";
    const isConfirm = variant === "confirm";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        {isError ? (
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle size={18} className="text-red-500" />
                            </div>
                        ) : isAlert ? (
                            <div className="w-9 h-9 rounded-full bg-[#81b29a]/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-[#609279]" />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-[#a16b9f]/10 flex items-center justify-center shrink-0">
                                <AlertCircle size={18} className="text-[#a16b9f]" />
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-[#3d405b]">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-[#3d405b]/30 hover:text-[#3d405b]/60 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <p className="text-sm text-[#3d405b]/60 mb-4 pl-[46px]">{message}</p>
                )}

                {/* Custom Content */}
                {children && <div className="mb-4 pl-[46px]">{children}</div>}

                {/* Buttons */}
                <div className="flex gap-3 pl-[46px]">
                    {isConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm font-medium text-[#3d405b]/60 hover:bg-[#f4f1de]/50 transition-colors"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#a16b9f]/20 disabled:opacity-50 transition-all"
                            >
                                {loading ? "กำลังดำเนินการ..." : confirmLabel}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-[#3d405b] text-white rounded-xl text-sm font-medium hover:bg-[#3d405b]/80 transition-colors"
                        >
                            ตกลง
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
