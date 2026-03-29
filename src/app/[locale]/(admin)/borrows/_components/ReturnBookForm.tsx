"use client";

import { useState } from "react";
import { returnBooks } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTranslations } from "next-intl";

interface BookItem {
    id: string;
    bookId: string;
    returned: boolean;
    book: { title: string; category: string | null };
}

interface ReturnBookFormProps {
    borrowId: string;
    items: BookItem[];
    dueDate: string;
    depositCoins: number;
    hasOtherBorrows: boolean;
    lateFeePreview: {
        lateDays: number;
        feeCoins: number;
        forfeitDeposit: boolean;
    };
}

export default function ReturnBookForm({ borrowId, items, depositCoins, hasOtherBorrows, lateFeePreview }: ReturnBookFormProps) {
    const t = useTranslations("AdminBorrows.returnForm");
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [damagedItems, setDamagedItems] = useState<Map<string, number>>(new Map());
    const [selectedItems, setSelectedItems] = useState<Set<string>>(
        new Set(items.filter(i => !i.returned).map(i => i.id))
    );
    const [result, setResult] = useState<{ success?: boolean; error?: string; lateFee?: number; damageFee?: number; forfeitDeposit?: boolean; depositReturned?: number; isFullReturn?: boolean; returnedCount?: number; remainingCount?: number } | null>(null);

    const unreturned = items.filter(i => !i.returned);

    const toggleSelect = (itemId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const toggleDamage = (itemId: string) => {
        setDamagedItems(prev => {
            const next = new Map(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.set(itemId, 1); // default 1 coin
            return next;
        });
    };

    const setDamageFee = (itemId: string, fee: number) => {
        setDamagedItems(prev => {
            const next = new Map(prev);
            next.set(itemId, Math.max(0, fee));
            return next;
        });
    };

    const totalDamageFee = Array.from(damagedItems.entries())
        .filter(([id]) => selectedItems.has(id))
        .reduce((s, [, v]) => s + v, 0);

    const handleReturn = async () => {
        if (selectedItems.size === 0) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("borrowId", borrowId);
        fd.set("returnItemIds", JSON.stringify(Array.from(selectedItems)));
        fd.set("damagedItems", JSON.stringify(Array.from(damagedItems.keys()).filter(id => selectedItems.has(id))));
        fd.set("customDamageFee", String(totalDamageFee));
        const res = await returnBooks(fd);
        setResult(res);
        setLoading(false);
        if (res.success) {
            setTimeout(() => router.refresh(), 2000);
        }
    };

    if (result?.success) {
        return (
            <Card className="mt-4 bg-emerald-50 border-emerald-200">
                <div className="text-center py-4">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-600" />
                    <p className="font-bold text-emerald-700 text-lg">
                        {t("successTitle", { count: result.returnedCount ?? 0 })}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-emerald-600">
                        {(result.remainingCount ?? 0) > 0 && (
                            <p className="text-amber-600">{t("remaining", { count: result.remainingCount ?? 0 })}</p>
                        )}
                        {(result.lateFee ?? 0) > 0 && <p>{t("lateFee", { fee: result.lateFee ?? 0 })}</p>}
                        {(result.damageFee ?? 0) > 0 && <p>{t("damageFee", { fee: result.damageFee ?? 0 })}</p>}
                        {result.forfeitDeposit ? (
                            <p className="text-red-600 font-medium">{t("forfeitDeposit", { fee: depositCoins })}</p>
                        ) : (result.depositReturned ?? 0) > 0 ? (
                            <p>{t("depositReturned", { fee: result.depositReturned ?? 0 })}</p>
                        ) : depositCoins > 0 && result.isFullReturn ? (
                            <p className="text-amber-600">{t("depositPending")}</p>
                        ) : null}
                    </div>
                    <p className="text-xs text-emerald-500 mt-3">{t("refreshing")}</p>
                </div>
            </Card>
        );
    }

    if (result?.error) {
        return (
            <Card className="mt-4 bg-red-50 border-red-200">
                <div className="text-center py-4">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
                    <p className="font-bold text-red-600">{result.error}</p>
                    <button onClick={() => setResult(null)} className="text-sm text-red-500 underline mt-2">{t("tryAgain")}</button>
                </div>
            </Card>
        );
    }

    if (unreturned.length === 0) {
        return null; // All items already returned
    }

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="mt-4 w-full py-3 bg-[#609279] text-white font-semibold rounded-xl shadow-md shadow-[#609279]/20 hover:bg-[#81b29a] transition-colors flex items-center justify-center gap-2"
            >
                <RotateCcw size={18} />
                {t("openFormBtn")}
            </button>
        );
    }

    const isLate = lateFeePreview.lateDays > 0;
    const isAllSelected = selectedItems.size === unreturned.length;

    return (
        <Card className="mt-4">
            <h3 className="font-bold text-[#3d405b] mb-4 flex items-center gap-2">
                <RotateCcw size={16} className="text-[#609279]" />
                {t("formTitle")}
            </h3>

            {/* Late fee warning */}
            {isLate && (
                <div className={`rounded-xl p-3 mb-4 ${lateFeePreview.forfeitDeposit ? "bg-red-50" : "bg-amber-50"}`}>
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className={lateFeePreview.forfeitDeposit ? "text-red-500 mt-0.5" : "text-amber-500 mt-0.5"} />
                        <div>
                            <p className={`text-sm font-medium ${lateFeePreview.forfeitDeposit ? "text-red-600" : "text-amber-600"}`}>
                                {t("lateNotice", { days: lateFeePreview.lateDays })}
                            </p>
                            {lateFeePreview.forfeitDeposit ? (
                                <p className="text-xs text-red-500 mt-0.5">
                                    {t("lateForfeit", { fee: depositCoins })}
                                </p>
                            ) : lateFeePreview.feeCoins > 0 ? (
                                <p className="text-xs text-amber-500 mt-0.5">
                                    {t("lateFeeNotice", { fee: lateFeePreview.feeCoins })}
                                </p>
                            ) : (
                                <p className="text-xs text-emerald-500 mt-0.5">
                                    {t("noFeeNotice")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isLate && (
                <div className="rounded-xl p-3 mb-4 bg-emerald-50">
                    <p className="text-sm text-emerald-600 font-medium">{t("onTime")}</p>
                </div>
            )}

            {/* Select all / deselect all */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[#3d405b]/60">{t("selectBooks")}</p>
                <button
                    type="button"
                    onClick={() => {
                        if (isAllSelected) {
                            setSelectedItems(new Set());
                        } else {
                            setSelectedItems(new Set(unreturned.map(i => i.id)));
                        }
                    }}
                    className="text-xs text-[#609279] hover:underline"
                >
                    {isAllSelected ? t("deselectAll") : t("selectAll")}
                </button>
            </div>

            {/* Book items with select + damage */}
            <div className="space-y-2 mb-4">
                {unreturned.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const isDamaged = damagedItems.has(item.id);
                    return (
                        <div
                            key={item.id}
                            className={`p-3 rounded-xl transition-all ${isSelected
                                ? isDamaged
                                    ? "bg-red-50 border-2 border-red-200"
                                    : "bg-emerald-50 border-2 border-emerald-200"
                                : "bg-[#f4f1de]/30 border-2 border-[#d1cce7]/15 opacity-60"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Select checkbox */}
                                <button
                                    type="button"
                                    onClick={() => toggleSelect(item.id)}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#609279]" : "bg-[#d1cce7]/25 hover:bg-[#d1cce7]/40"
                                        }`}
                                >
                                    {isSelected && <Check size={14} className="text-white" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#3d405b] truncate">{item.book.title}</p>
                                    {item.book.category && (
                                        <p className="text-xs text-[#3d405b]/40">{item.book.category}</p>
                                    )}
                                </div>

                                {/* Damage toggle - only if selected */}
                                {isSelected && (
                                    <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={isDamaged}
                                            onChange={() => toggleDamage(item.id)}
                                            className="w-3.5 h-3.5 rounded border-red-300 text-red-500 focus:ring-red-200"
                                        />
                                        <span className="text-xs text-red-500">{t("damagedToggle")}</span>
                                    </label>
                                )}
                            </div>

                            {/* Damage fee input */}
                            {isSelected && isDamaged && (
                                <div className="mt-2 ml-9 flex items-center gap-2">
                                    <label className="text-xs text-red-500">{t("damageFeeInput")}</label>
                                    <input
                                        type="number"
                                        value={damagedItems.get(item.id) ?? 1}
                                        onChange={(e) => setDamageFee(item.id, parseInt(e.target.value) || 0)}
                                        min="0"
                                        className="w-20 px-2 py-1 border border-red-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                    />
                                    <span className="text-xs text-red-400">{t("coins")}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Show already returned items */}
                {items.filter(i => i.returned).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#d1cce7]/20">
                        <p className="text-xs text-[#3d405b]/40 mb-1">{t("alreadyReturned")}</p>
                        {items.filter(i => i.returned).map(item => (
                            <div key={item.id} className="flex items-center gap-2 p-2 text-sm text-[#3d405b]/40">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <span className="line-through">{item.book.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="bg-[#f4f1de]/50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                <p className="font-medium text-[#3d405b]">{t("summary", { selected: selectedItems.size, total: unreturned.length })}</p>
                {!isAllSelected && (
                    <p className="text-xs text-amber-600">
                        {t("partialReturnNotice")}
                    </p>
                )}
                {isAllSelected && lateFeePreview.feeCoins > 0 && !lateFeePreview.forfeitDeposit && (
                    <div className="flex justify-between text-amber-600">
                        <span>{t("lateFeeLabel", { days: lateFeePreview.lateDays })}</span>
                        <span className="font-medium">{lateFeePreview.feeCoins} {t("coins")}</span>
                    </div>
                )}
                {totalDamageFee > 0 && (
                    <div className="flex justify-between text-red-600">
                        <span>{t("damageFeeLabel")}</span>
                        <span className="font-medium">{totalDamageFee} {t("coins")}</span>
                    </div>
                )}
                {isAllSelected && (lateFeePreview.forfeitDeposit ? (
                    <div className="flex justify-between text-red-600 font-medium">
                        <span>{t("forfeitLabel")}</span>
                        <span>{depositCoins} {t("coins")}</span>
                    </div>
                ) : hasOtherBorrows ? (
                    <div className="flex justify-between text-amber-600">
                        <span>{t("depositLabel")}</span>
                        <span className="font-medium text-xs">{t("depositPendingLabel")}</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-emerald-600">
                        <span>{t("depositReturnedLabel")}</span>
                        <span className="font-medium">{depositCoins} {t("coins")}</span>
                    </div>
                ))}
            </div>

            {/* Late fee tiers reference */}
            <details className="mb-4">
                <summary className="text-xs text-[#3d405b]/40 cursor-pointer hover:text-[#3d405b]/60">
                    {t("ratesHeader")}
                </summary>
                <div className="mt-2 text-xs text-[#3d405b]/50 space-y-1 pl-3">
                    <p>{t("rate1")}</p>
                    <p>{t("rate2")}</p>
                    <p>{t("rate3")}</p>
                    <p>{t("rate4")}</p>
                </div>
            </details>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setShowForm(false); setDamagedItems(new Map()); setSelectedItems(new Set(unreturned.map(i => i.id))); }}
                    disabled={loading}
                    className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm font-medium text-[#3d405b]/60 hover:bg-[#f4f1de]/50 transition-colors disabled:opacity-50"
                >
                    {t("cancel")}
                </button>
                <button
                    onClick={handleReturn}
                    disabled={loading || selectedItems.size === 0}
                    className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#609279]/20 hover:bg-[#81b29a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            <RotateCcw size={14} />
                            {t("confirmReturn", { count: selectedItems.size })}
                        </>
                    )}
                </button>
            </div>
        </Card>
    );
}
