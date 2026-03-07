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
            className="flex items-center gap-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b]/80 mb-6"
        >
            <ArrowLeft size={16} />
            {label}
        </Link>
    );
}
