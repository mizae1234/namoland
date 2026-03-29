"use client";

import { useState, useCallback } from "react";
import { getMemberReport, MemberReportData } from "@/actions/report";
import { searchMembers } from "@/actions/member";
import { Search, User, ArrowUpCircle, ArrowDownCircle, Coins, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTranslations } from "next-intl";

interface MemberOption {
    id: string;
    parentName: string;
    phone: string;
    children: { id: string; name: string }[];
}

const TYPE_LABELS: Record<string, { labelKey: string; color: string }> = {
    Purchase: { labelKey: "Purchase", color: "text-emerald-600 bg-emerald-50" },
    Class: { labelKey: "Class", color: "text-violet-600 bg-violet-50" },
    "Adjust+": { labelKey: "AdjustUp", color: "text-blue-600 bg-blue-50" },
    "Adjust-": { labelKey: "AdjustDown", color: "text-orange-600 bg-orange-50" },
    Expired: { labelKey: "Expired", color: "text-red-600 bg-red-50" },
    "BOOK RENTAL": { labelKey: "BookRental", color: "text-amber-600 bg-amber-50" },
    "BOOK DEPOSIT": { labelKey: "BookDeposit", color: "text-amber-600 bg-amber-50" },
    "BORROW FEE": { labelKey: "BorrowFee", color: "text-amber-600 bg-amber-50" },
    "LATE FEE": { labelKey: "LateFee", color: "text-red-500 bg-red-50" },
};

function getTypeInfo(type: string, t: any) {
    const defaultInfo = { label: type, color: "text-gray-600 bg-gray-50" };
    const config = TYPE_LABELS[type];
    if (config) {
        return { label: t(`types.${config.labelKey}`), color: config.color };
    }
    return defaultInfo;
}

export default function MemberCoinReport() {
    const t = useTranslations("AdminReports.memberCoin");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
    const [reportData, setReportData] = useState<MemberReportData | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Debounced search
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setSearching(true);
        try {
            const results = await searchMembers(query.trim());
            setSearchResults(results as MemberOption[]);
            setShowDropdown(true);
        } catch {
            setSearchResults([]);
        }
        setSearching(false);
    }, []);

    const handleSelectMember = async (member: MemberOption) => {
        setSelectedMember(member);
        setSearchQuery(member.parentName);
        setShowDropdown(false);
        setLoadingReport(true);
        try {
            const data = await getMemberReport(member.id);
            setReportData(data);
        } catch {
            setReportData(null);
        }
        setLoadingReport(false);
    };

    // Summary calculations
    const summary = reportData ? {
        totalIn: reportData.rows.reduce((s, r) => s + r.coinPurchase, 0),
        totalOut: reportData.rows.reduce((s, r) => s + r.coinUsage, 0),
        totalAmount: reportData.rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        currentBalance: reportData.rows.length > 0 ? reportData.rows[reportData.rows.length - 1].balance : 0,
    } : null;

    return (
        <div>
            {/* Search Input */}
            <Card className="mb-6">
                <div className="relative">
                    <label className="text-sm font-medium text-[#3d405b]/60 block mb-2">
                        {t("searchLabel")}
                    </label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            placeholder={t("searchPlaceholder")}
                            className="w-full pl-10 pr-10 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                        />
                        {searching && (
                            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#609279] animate-spin" />
                        )}
                    </div>

                    {/* Dropdown Results */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#d1cce7]/30 rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
                            {searchResults.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleSelectMember(m)}
                                    className="w-full text-left px-4 py-3 hover:bg-[#f4f1de]/50 transition-colors border-b border-[#d1cce7]/10 last:border-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-[#609279] flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#3d405b]">{m.parentName}</p>
                                            <div className="flex items-center gap-2 text-xs text-[#3d405b]/50">
                                                <span>{m.phone}</span>
                                                {m.children.length > 0 && (
                                                    <span>
                                                        · {m.children.map(c => c.name).join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#d1cce7]/30 rounded-xl shadow-lg py-4 text-center text-[#3d405b]/40 text-sm">
                            {t("noMemberFound")}
                        </div>
                    )}
                </div>
            </Card>

            {/* Loading */}
            {loadingReport && (
                <div className="text-center py-12">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#609279] mb-2" />
                    <p className="text-sm text-[#3d405b]/40">{t("loadingData")}</p>
                </div>
            )}

            {/* Report Content */}
            {reportData && selectedMember && !loadingReport && (
                <div>
                    {/* Member Info & Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <Card className="!bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowUpCircle size={16} className="text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-600/70">{t("summary.coinsIn")}</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-700">{summary?.totalIn.toLocaleString()}</p>
                        </Card>
                        <Card className="!bg-violet-50 border border-violet-200">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowDownCircle size={16} className="text-violet-600" />
                                <span className="text-xs font-medium text-violet-600/70">{t("summary.coinsOut")}</span>
                            </div>
                            <p className="text-xl font-bold text-violet-700">{summary?.totalOut.toLocaleString()}</p>
                        </Card>
                        <Card className="!bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Coins size={16} className="text-amber-600" />
                                <span className="text-xs font-medium text-amber-600/70">{t("summary.remaining")}</span>
                            </div>
                            <p className="text-xl font-bold text-amber-700">{summary?.currentBalance.toLocaleString()}</p>
                        </Card>
                        <Card className="!bg-sky-50 border border-sky-200">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-sky-600/70">💰 {t("summary.purchaseAmount")}</span>
                            </div>
                            <p className="text-xl font-bold text-sky-700">฿{summary?.totalAmount.toLocaleString()}</p>
                        </Card>
                    </div>

                    {/* Transaction Table */}
                    <Card padding={false} className="overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#d1cce7]/20 bg-[#f4f1de]/30">
                            <h3 className="font-semibold text-[#3d405b] text-sm flex items-center gap-2">
                                <User size={14} className="text-[#609279]" />
                                {reportData.memberName}
                                {selectedMember.children.length > 0 && (
                                    <span className="text-xs font-normal text-[#3d405b]/40">
                                        ({selectedMember.children.map(c => c.name).join(", ")})
                                    </span>
                                )}
                                <span className="ml-auto text-xs font-normal text-[#3d405b]/40">
                                    {reportData.rows.length} {t("table.items")}
                                </span>
                            </h3>
                        </div>

                        {reportData.rows.length === 0 ? (
                            <div className="py-12 text-center text-[#3d405b]/40 text-sm">
                                {t("table.empty")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/20 text-left">
                                            <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs">{t("table.date")}</th>
                                            <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs">{t("table.type")}</th>
                                            <th className="py-2.5 px-4 font-semibold text-[#3d405b]/60 text-xs">{t("table.details")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("table.coinsIn")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("table.coinsOut")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("table.balance")}</th>
                                            <th className="py-2.5 px-3 font-semibold text-[#3d405b]/60 text-xs text-right">{t("table.amount")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#d1cce7]/10">
                                        {reportData.rows.map((row, idx) => {
                                            const typeInfo = getTypeInfo(row.type, t);
                                            return (
                                                <tr key={idx} className="hover:bg-[#f4f1de]/30 transition-colors">
                                                    <td className="py-2 px-4 text-[#3d405b]/60 text-xs whitespace-nowrap">{row.date}</td>
                                                    <td className="py-2 px-4">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                                            {typeInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-[#3d405b] text-xs max-w-[200px] truncate">
                                                        {row.className || "-"}
                                                        {row.dateTime && (
                                                            <span className="text-[#3d405b]/40 ml-1">({row.dateTime})</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        {row.coinPurchase > 0 ? (
                                                            <span className="text-emerald-600 font-semibold text-xs">+{row.coinPurchase}</span>
                                                        ) : (
                                                            <span className="text-[#3d405b]/20 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        {row.coinUsage > 0 ? (
                                                            <span className="text-red-500 font-semibold text-xs">-{row.coinUsage}</span>
                                                        ) : (
                                                            <span className="text-[#3d405b]/20 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <span className="font-semibold text-[#3d405b] text-xs">{row.balance}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-xs">
                                                        {row.amount !== 0 ? (
                                                            <span className={row.amount > 0 ? "text-emerald-600" : "text-red-500"}>
                                                                {row.amount > 0 ? "+" : ""}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}฿
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#3d405b]/20">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#f4f1de]/50 border-t-2 border-[#d1cce7]/30 font-semibold">
                                            <td colSpan={3} className="py-2.5 px-4 text-xs text-[#3d405b]/60">{t("table.total")}</td>
                                            <td className="py-2.5 px-3 text-right text-xs text-emerald-600">+{summary?.totalIn.toLocaleString()}</td>
                                            <td className="py-2.5 px-3 text-right text-xs text-red-500">-{summary?.totalOut.toLocaleString()}</td>
                                            <td className="py-2.5 px-3 text-right text-xs text-[#3d405b]">{summary?.currentBalance.toLocaleString()}</td>
                                            <td className="py-2.5 px-3 text-right text-xs text-sky-600">฿{summary?.totalAmount.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Placeholder */}
            {!reportData && !loadingReport && (
                <div className="text-center py-16">
                    <User size={48} className="mx-auto text-[#3d405b]/15 mb-3" />
                    <p className="text-[#3d405b]/40 text-sm">{t("selectPrompt")}</p>
                </div>
            )}
        </div>
    );
}
