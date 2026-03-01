"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export default function MemberSearch({ defaultValue }: { defaultValue?: string }) {
    const router = useRouter();
    const [search, setSearch] = useState(defaultValue || "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        router.push(`/members?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือเบอร์โทร..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
            </div>
        </form>
    );
}
