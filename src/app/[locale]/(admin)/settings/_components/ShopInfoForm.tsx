"use client";

import { useState } from "react";
import { updateShopInfo } from "@/actions/shop";
import { Save, Store, Building2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTranslations } from "next-intl";

interface ShopInfoProps {
    shopInfo: {
        id: string;
        shopName: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        note: string | null;
    };
}

export default function ShopInfoForm({ shopInfo }: ShopInfoProps) {
    const t = useTranslations("AdminSettings.shopInfo");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const formData = new FormData(e.currentTarget);
        const result = await updateShopInfo(formData);

        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage(t("saveSuccess"));
        }
        setLoading(false);
        setTimeout(() => setMessage(""), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Info */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <Store size={18} className="text-[#609279]" />
                    <h2 className="font-semibold text-[#3d405b]">{t("shopSection")}</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">{t("shopNameLabel")}</label>
                        <input
                            name="shopName"
                            defaultValue={shopInfo.shopName}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder={t("shopNamePh")}
                        />
                    </div>
                </div>
            </Card>

            {/* Bank Account */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <Building2 size={18} className="text-emerald-500" />
                    <h2 className="font-semibold text-[#3d405b]">{t("bankSection")}</h2>
                </div>
                <p className="text-xs text-[#3d405b]/40 mb-4">{t("bankDesc")}</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">{t("bankNameLabel")}</label>
                        <input
                            name="bankName"
                            defaultValue={shopInfo.bankName || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder={t("bankNamePh")}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">{t("accountNoLabel")}</label>
                        <input
                            name="accountNumber"
                            defaultValue={shopInfo.accountNumber || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder={t("accountNoPh")}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">{t("accountNameLabel")}</label>
                        <input
                            name="accountName"
                            defaultValue={shopInfo.accountName || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder={t("accountNamePh")}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">{t("noteLabel")}</label>
                        <textarea
                            name="note"
                            defaultValue={shopInfo.note || ""}
                            rows={2}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm resize-none"
                            placeholder={t("notePh")}
                        />
                    </div>
                </div>
            </Card>

            {/* Save Button */}
            {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message === t("saveSuccess") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {message}
                </div>
            )}
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
                <Save size={18} />
                {loading ? t("savingBtn") : t("saveBtn")}
            </button>
        </form>
    );
}
