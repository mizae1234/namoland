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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#3d405b]">{title}</h1>
                {subtitle && <p className="text-sm sm:text-base text-[#3d405b]/50 mt-1">{subtitle}</p>}
            </div>
            {actionHref && actionLabel && (
                <Link
                    href={actionHref}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white rounded-xl text-sm font-medium hover:from-[#81b29a] hover:to-[#a16b9f] transition-all shadow-md shadow-[#a16b9f]/20 self-start sm:self-auto"
                >
                    {actionIcon || <Plus size={18} />}
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
