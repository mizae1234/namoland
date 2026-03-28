"use client";

import { useState } from "react";
import { createTopUpRequest } from "@/actions/coin";
import { ArrowLeft, Coins, Copy, Check, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface PackageInfo {
    key: string;
    coins: number;
    price: number;
    bonus: number;
}

interface TopUpFormProps {
    bankInfo: {
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        note: string | null;
    };
    packages: PackageInfo[];
}

export default function TopUpForm({ bankInfo, packages }: TopUpFormProps) {
    const t = useTranslations("UserCoinsTopUp");
    const [selected, setSelected] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const selectedPkg = packages.find((p) => p.key === selected);

    const copyAccount = async () => {
        if (bankInfo.accountNumber) {
            await navigator.clipboard.writeText(bankInfo.accountNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async () => {
        if (!selected) return;
        setLoading(true);
        setError("");

        const result = await createTopUpRequest(selected, note || undefined);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-4">
                <div className="bg-emerald-50 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} className="text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-bold text-emerald-800 mb-2">{t("title")}</h2>
                    <p className="text-sm text-emerald-600 mb-6">
                        {t("subtitle")}
                    </p>
                    <Link
                        href="/user/coins"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                    >
                        {t("backToCoins")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/user/coins" className="p-2 hover:bg-[#d1cce7]/15 rounded-xl transition-colors">
                    <ArrowLeft size={20} className="text-[#3d405b]/70" />
                </Link>
                <h1 className="text-lg font-bold text-[#3d405b]">{t("headerTitle")}</h1>
            </div>

            {/* Step 1: Choose Package */}
            <div className="mb-6">
                <p className="text-sm font-medium text-[#3d405b]/70 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#609279] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    {t("step1Title")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {packages.map((pkg) => (
                        <button
                            key={pkg.key}
                            onClick={() => setSelected(pkg.key)}
                            className={`p-4 rounded-2xl border-2 transition-all text-left ${selected === pkg.key
                                ? "border-[#609279] bg-[#81b29a]/10 shadow-lg shadow-[#81b29a]/20"
                                : "border-[#d1cce7]/20 bg-white hover:border-[#d1cce7]/30"
                                }`}
                        >
                            <div className="flex items-center gap-1 mb-1">
                                <Coins size={16} className="text-amber-500" />
                                <span className="text-lg font-bold text-[#3d405b]">{pkg.coins}</span>
                            </div>
                            <p className="text-xs text-[#3d405b]/50">฿{pkg.price.toLocaleString()}</p>
                            {pkg.bonus > 0 && (
                                <p className="text-xs text-emerald-500 font-medium mt-1">
                                    +{t("bonus")} ฿{pkg.bonus.toLocaleString()}
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Bank Transfer Info */}
            {selected && (
                <>
                    <div className="mb-6">
                        <p className="text-sm font-medium text-[#3d405b]/70 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#609279] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            {t("step2Title")} ฿{selectedPkg?.price.toLocaleString()}
                        </p>
                        {bankInfo.accountNumber ? (
                            <div className="bg-[#f4f1de]/50 rounded-2xl p-4 border border-[#d1cce7]/20">
                                <div className="space-y-2 text-sm">
                                    {bankInfo.bankName && (
                                        <div className="flex justify-between">
                                            <span className="text-[#3d405b]/40">{t("bankLabel")}</span>
                                            <span className="font-medium text-[#3d405b]/80">{bankInfo.bankName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#3d405b]/40">{t("accountLabel")}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-[#3d405b]">{bankInfo.accountNumber}</span>
                                            <button
                                                onClick={copyAccount}
                                                className="p-1.5 hover:bg-[#d1cce7]/25 rounded-lg transition-colors"
                                                title={t("copyTitle")}
                                            >
                                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-[#3d405b]/40" />}
                                            </button>
                                        </div>
                                    </div>
                                    {bankInfo.accountName && (
                                        <div className="flex justify-between">
                                            <span className="text-[#3d405b]/40">{t("accountNameLabel")}</span>
                                            <span className="font-medium text-[#3d405b]/80">{bankInfo.accountName}</span>
                                        </div>
                                    )}
                                </div>
                                {bankInfo.note && (
                                    <p className="mt-3 pt-3 border-t border-[#d1cce7]/30 text-xs text-[#3d405b]/50">{bankInfo.note}</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                                <p className="text-sm text-amber-700">{t("noBankAccount")}</p>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Confirm */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-[#3d405b]/70 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#609279] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            {t("step3Title")}
                        </p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t("notePlaceholder")}
                            rows={2}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm resize-none mb-3"
                        />

                        {error && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50"
                        >
                            <Send size={18} />
                            {loading ? t("sending") : `${t("submitBtn")} ฿${selectedPkg?.price.toLocaleString()}`}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
