import Link from "next/link";
import { Plus } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actionHref?: string;
    actionLabel?: string;
    actionIcon?: ReactNode;
}

export default function PageHeader({
    title,
    subtitle,
    actionHref,
    actionLabel,
    actionIcon,
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {actionHref && actionLabel && (
                <Link
                    href={actionHref}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                >
                    {actionIcon || <Plus size={18} />}
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
