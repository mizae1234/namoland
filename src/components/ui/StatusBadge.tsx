"use client";

import { BORROW_STATUS_MAP } from "@/lib/constants";
import { useTranslations } from "next-intl";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const t = useTranslations("BorrowStatus");
    const config = BORROW_STATUS_MAP[status] || { className: "bg-[#d1cce7]/15 text-[#3d405b]/80" };

    // Fallback securely if translation doesn't exist
    let label = status;
    try {
        label = t(status);
    } catch {
        // use default label
    }

    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className} ${className}`}>
            {label}
        </span>
    );
}
