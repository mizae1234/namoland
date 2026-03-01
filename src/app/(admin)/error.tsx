"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    เกิดข้อผิดพลาด
                </h2>
                <p className="text-slate-500 mb-6 text-sm">
                    {error.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                    <RefreshCw size={16} />
                    ลองใหม่
                </button>
            </div>
        </div>
    );
}
