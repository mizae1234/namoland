import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
    href: string;
    label?: string;
}

export default function BackLink({ href, label = "กลับ" }: BackLinkProps) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
            <ArrowLeft size={16} />
            {label}
        </Link>
    );
}
