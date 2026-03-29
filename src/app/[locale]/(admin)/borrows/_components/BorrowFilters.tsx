"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import Card from "@/components/ui/Card";
import DateInput from "@/components/ui/DateInput";
import { useTranslations } from "next-intl";

export default function BorrowFilters({
    defaultSearch,
    defaultFrom,
    defaultTo,
}: {
    defaultSearch: string;
    defaultFrom: string;
    defaultTo: string;
}) {
    const t = useTranslations("AdminBorrows.filters");
    const router = useRouter();
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
                        <label className="block text-xs font-medium text-[#3d405b]/50 mb-1.5">
                            {t("searchLabel")}
                        </label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/40" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t("searchPlaceholder")}
                                className="w-full pl-9 pr-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Date From */}
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-[#3d405b]/50 mb-1.5">
                            <Calendar size={12} className="inline mr-1" />
                            {t("dateFrom")}
                        </label>
                        <DateInput
                            value={from}
                            onChange={(val) => setFrom(val)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-[#3d405b]/50 mb-1.5">
                            <Calendar size={12} className="inline mr-1" />
                            {t("dateTo")}
                        </label>
                        <DateInput
                            value={to}
                            onChange={(val) => setTo(val)}
                        />
                    </div>

                    {/* Apply */}
                    <button
                        onClick={applyFilters}
                        className="px-5 py-2.5 bg-[#609279] hover:bg-[#609279] text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                    >
                        {t("submitBtn")}
                    </button>
                </div>
            </div>
        </Card>
    );
}
