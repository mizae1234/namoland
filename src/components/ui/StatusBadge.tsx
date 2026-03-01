import { BORROW_STATUS_MAP } from "@/lib/constants";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
    const config = BORROW_STATUS_MAP[status] || { label: status, className: "bg-slate-100 text-slate-700" };

    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className} ${className}`}>
            {config.label}
        </span>
    );
}
