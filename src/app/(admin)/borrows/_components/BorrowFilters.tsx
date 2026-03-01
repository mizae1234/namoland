"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import Card from "@/components/ui/Card";

export default function BorrowFilters({
    defaultSearch,
    defaultFrom,
    defaultTo,
}: {
    defaultSearch: string;
    defaultFrom: string;
    defaultTo: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(defaultSearch);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        router.push(`/borrows?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyFilters();
    };

    return (
        <Card className="mb-4" padding={false}>
            <div className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                            ค้นหา (ชื่อลูกค้า / ชื่อหนังสือ / รหัส)
                        </label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="พิมพ์เพื่อค้นหา..."
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Date From */}
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                            <Calendar size={12} className="inline mr-1" />
                            ตั้งแต่วันที่
                        </label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                    </div>

                    {/* Date To */}
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                            <Calendar size={12} className="inline mr-1" />
                            ถึงวันที่
                        </label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                    </div>

                    {/* Apply */}
                    <button
                        onClick={applyFilters}
                        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                    >
                        ค้นหา
                    </button>
                </div>
            </div>
        </Card>
    );
}
