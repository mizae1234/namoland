"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { purchasePackage, spendCoins, extendExpiry, deductCoins, adjustCoinsUp } from "@/actions/coin";
import { getRecentClassEntriesByActivity } from "@/actions/classSchedule";
import { Coins, ShoppingCart, Banknote, CreditCard, CalendarPlus, MinusCircle, PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import DateInput from "@/components/ui/DateInput";
import { useTranslations, useLocale } from "next-intl";

interface PackageOption {
    type: string;
    label: string;
    price: string;
    coins: number;
    bonus: string;
}

interface ActivityOption {
    name: string;
    coins: number;
}

interface MemberActionsProps {
    member: {
        id: string;
        coinExpiryOverride: string | Date | null;
        coinPackages: Array<{
            id: string;
            packageType: string;
            totalCoins: number;
            remainingCoins: number;
            isExpired: boolean;
            expiresAt: string | Date | null;
        }>;
    };
    packages: PackageOption[];
    activities: ActivityOption[];
}

export default function MemberActions({ member, packages, activities }: MemberActionsProps) {
    const t = useTranslations("AdminMembers.detail.actions");
    const locale = useLocale();
    const router = useRouter();
    const dateLocale = locale === "en" ? enUS : th;
    const [showBuy, setShowBuy] = useState(false);
    const [showUse, setShowUse] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showDeduct, setShowDeduct] = useState(false);
    const [showAdjustUp, setShowAdjustUp] = useState(false);
    const [loading, setLoading] = useState(false);

    // Use coins confirm state
    const [pendingUse, setPendingUse] = useState<{ coins: number; label: string; hours: number; isCustom?: boolean } | null>(null);
    const [customActivity, setCustomActivity] = useState(false);
    const [customActivityName, setCustomActivityName] = useState("");
    const [customActivityCoins, setCustomActivityCoins] = useState("");
    const [classOptions, setClassOptions] = useState<Array<{id: string; title: string; date: string; startTime: string; endTime: string; teacherName: string | null}>>([]);
    const [selectedTargetDate, setSelectedTargetDate] = useState<string>("");
    const [fetchingClasses, setFetchingClasses] = useState(false);
    const [message, setMessage] = useState("");

    const [deductAmount, setDeductAmount] = useState("");
    const [deductReason, setDeductReason] = useState("");
    const [deductDate, setDeductDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

    // Adjust up state
    const [addAmount, setAddAmount] = useState("");
    const [addReason, setAddReason] = useState("");

    // Buy confirmation state
    const [selectedPkg, setSelectedPkg] = useState<PackageOption | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
    const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [note, setNote] = useState("");

    // Custom purchase state
    const [showCustom, setShowCustom] = useState(false);
    const [openCustomModal, setOpenCustomModal] = useState(false);
    const [customCoins, setCustomCoins] = useState("");
    const [customPrice, setCustomPrice] = useState("");

    // Extend state
    const currentOverride = member.coinExpiryOverride ? new Date(member.coinExpiryOverride) : null;
    const [extendDate, setExtendDate] = useState(() => {
        if (currentOverride) return format(currentOverride, "yyyy-MM-dd");
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return format(d, "yyyy-MM-dd");
    });
    const [extendNote, setExtendNote] = useState("");

    const activePackages = member.coinPackages.filter(
        (p) => !p.isExpired && p.remainingCoins > 0
    );

    const closeAll = () => { setShowBuy(false); setShowUse(false); setShowExtend(false); setShowDeduct(false); setShowAdjustUp(false); setPendingUse(null); setCustomActivity(false); };

    const handleSelectPackage = (pkg: PackageOption) => {
        setSelectedPkg(pkg);
        setShowCustom(false);
        setPaymentMethod("CASH");
        setNote("");
    };

    const handleSelectCustom = () => {
        setShowCustom(true);
        setSelectedPkg({ type: "CUSTOM", label: t("customLabel"), price: customPrice || "0", coins: parseInt(customCoins) || 0, bonus: "-" });
        setPaymentMethod("CASH");
        setNote("");
    };

    const handleConfirmBuy = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        if (showCustom) {
            fd.set("packageType", "CUSTOM");
            fd.set("customCoins", customCoins);
            fd.set("customPrice", customPrice);
        } else if (selectedPkg) {
            fd.set("packageType", selectedPkg.type);
        } else {
            setLoading(false);
            return;
        }
        fd.set("paymentMethod", paymentMethod);
        if (note.trim()) fd.set("note", note.trim());
        if (purchaseDate && purchaseDate !== format(new Date(), "yyyy-MM-dd")) {
            fd.set("purchaseDate", purchaseDate);
        }
        const result = await purchasePackage(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage(t("buySuccess"));
            setSelectedPkg(null);
            setShowBuy(false);
            setShowCustom(false);
            setOpenCustomModal(false);
            setCustomCoins("");
            setCustomPrice("");
            router.refresh();
            window.dispatchEvent(new Event('refresh-member-data'));
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleSelectActivity = async (cls: { coins: number; label: string; hours: number; isCustom?: boolean }) => {
        setPendingUse(cls);
        setCustomActivity(false);
        setSelectedTargetDate(format(new Date(), "yyyy-MM-dd"));
        
        if (!cls.isCustom) {
            setFetchingClasses(true);
            try {
                const results = await getRecentClassEntriesByActivity(cls.label);
                setClassOptions(results);
            } catch (err) {
                console.error(err);
            }
            setFetchingClasses(false);
        } else {
            setClassOptions([]);
        }
    };

    const handleConfirmUse = async () => {
        if (!pendingUse) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        fd.set("coinsUsed", String(pendingUse.coins));
        fd.set("className", pendingUse.label);
        fd.set("classHours", String(pendingUse.hours));
        
        if (selectedTargetDate) {
            const selectedClassById = classOptions.find(c => c.id === selectedTargetDate);
            if (selectedClassById) {
                fd.set("targetDate", selectedClassById.date);
                fd.set("classEntryId", selectedClassById.id);
                fd.set("classEntryTitle", selectedClassById.title);
                fd.set("classEntryTime", `${selectedClassById.startTime}-${selectedClassById.endTime}`);
            } else {
                const selectedClassByDate = classOptions.find(c => c.date.startsWith(selectedTargetDate));
                if (selectedClassByDate) {
                    fd.set("targetDate", selectedClassByDate.date);
                    fd.set("classEntryId", selectedClassByDate.id);
                    fd.set("classEntryTitle", selectedClassByDate.title);
                    fd.set("classEntryTime", `${selectedClassByDate.startTime}-${selectedClassByDate.endTime}`);
                } else {
                    fd.set("targetDate", selectedTargetDate);
                }
            }
        }
        
        const result = await spendCoins(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage(t("useSuccess"));
            setShowUse(false);
            setPendingUse(null);
            router.refresh();
            window.dispatchEvent(new Event('refresh-member-data'));
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleExtend = async () => {
        if (!extendDate) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        fd.set("targetDate", extendDate);
        if (extendNote.trim()) fd.set("note", extendNote.trim());
        const result = await extendExpiry(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage(t("extendSuccess"));
            setShowExtend(false);
            setExtendNote("");
            router.refresh();
            window.dispatchEvent(new Event('refresh-member-data'));
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleDeduct = async () => {
        if (!deductAmount) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        fd.set("coinsToDeduct", deductAmount);
        if (deductReason.trim()) fd.set("reason", deductReason.trim());
        if (deductDate) fd.set("targetDate", deductDate);
        const result = await deductCoins(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage(t("deductSuccess"));
            setShowDeduct(false);
            setDeductAmount("");
            setDeductReason("");
            router.refresh();
            window.dispatchEvent(new Event('refresh-member-data'));
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleAdjustUp = async () => {
        if (!addAmount) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        fd.set("coinsToAdd", addAmount);
        if (addReason.trim()) fd.set("reason", addReason.trim());
        const result = await adjustCoinsUp(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage(t("adjustUpSuccess"));
            setShowAdjustUp(false);
            setAddAmount("");
            setAddReason("");
            router.refresh();
            window.dispatchEvent(new Event('refresh-member-data'));
            setTimeout(() => setMessage(""), 3000);
        }
    };


    return (
        <div className="mb-6">
            <AlertMessage
                type={(message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                message={message}
            />

            <div className="flex gap-3 mb-4 flex-wrap">
                <button
                    onClick={() => { closeAll(); setShowBuy(!showBuy); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200"
                >
                    <ShoppingCart size={16} />
                    {t("buyCoins")}
                </button>
                <button
                    onClick={() => { closeAll(); setShowUse(!showUse); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-md shadow-amber-200"
                >
                    <Coins size={16} />
                    {t("useCoins")}
                </button>
                <button
                    onClick={() => { closeAll(); setShowExtend(!showExtend); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#a16b9f] text-white rounded-xl text-sm font-medium hover:bg-[#8a5a88] transition-colors shadow-md shadow-[#a16b9f]/30"
                >
                    <CalendarPlus size={16} />
                    {t("extendExpiry")}
                </button>
                <button
                    onClick={() => { closeAll(); setShowAdjustUp(!showAdjustUp); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                >
                    <PlusCircle size={16} />
                    {t("adjustUp")}
                </button>
                <button
                    onClick={() => { closeAll(); setShowDeduct(!showDeduct); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors shadow-md shadow-red-200"
                >
                    <MinusCircle size={16} />
                    {t("adjustDown")}
                </button>
                <Link
                    href={`/borrows/new/${member.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4a7a5f] transition-colors shadow-md shadow-[#81b29a]/30"
                >
                    <BookOpen size={16} />
                    {t("borrowBooks")}
                </Link>
            </div>

            {/* Buy Package */}
            {showBuy && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">{t("selectPackage")}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.type}
                                onClick={() => handleSelectPackage(pkg)}
                                disabled={loading}
                                className="p-4 border-2 border-[#d1cce7]/30 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/10 transition-all text-left disabled:opacity-50"
                            >
                                <p className="font-bold text-[#3d405b]">{pkg.label}</p>
                                <p className="text-sm text-[#3d405b]/50">{pkg.price} {t("baht")}</p>
                                {pkg.bonus !== "-" && (
                                    <p className="text-xs text-emerald-500 mt-1">{pkg.bonus}</p>
                                )}
                            </button>
                        ))}
                        <button
                            onClick={handleSelectCustom}
                            disabled={loading}
                            className="p-4 border-2 border-dashed border-[#a16b9f]/30 rounded-xl hover:border-[#a16b9f] hover:bg-[#a16b9f]/10 transition-all text-left disabled:opacity-50 col-span-2"
                        >
                            <p className="font-bold text-[#a16b9f]">✏️ {t("customLabel")}</p>
                            <p className="text-xs text-[#3d405b]/40">{t("customDesc")}</p>
                        </button>
                    </div>
                    {showCustom && (
                        <div className="mt-4 space-y-3 bg-[#a16b9f]/5 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#3d405b] block mb-1">{t("coinsAmount")}</label>
                                    <input
                                        type="number"
                                        value={customCoins}
                                        onChange={(e) => setCustomCoins(e.target.value)}
                                        placeholder="15"
                                        min="1"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#3d405b] block mb-1">{t("priceLabel")}</label>
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        placeholder="2500"
                                        min="0"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[#3d405b] block mb-1">
                                    {t("purchaseDate")} <span className="font-normal text-[#3d405b]/40">({t("purchaseDateHint")})</span>
                                </label>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                    className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                />
                                {purchaseDate !== format(new Date(), "yyyy-MM-dd") && (
                                    <p className="text-xs text-amber-600 mt-1 font-medium">
                                        ⏳ {t("purchaseDatePreview", { date: format(new Date(purchaseDate + "T00:00:00"), "d MMMM yyyy", { locale: dateLocale }) })}
                                    </p>
                                )}
                            </div>
                            {customCoins && customPrice && (
                                <p className="text-xs text-[#a16b9f] font-medium">
                                    ✓ {customCoins} {t("coinsUnit")} · {Number(customPrice).toLocaleString()} {t("baht")}
                                </p>
                            )}
                            <button
                                onClick={() => setOpenCustomModal(true)}
                                disabled={!customCoins || !customPrice || parseInt(customCoins) <= 0 || parseInt(customPrice) < 0}
                                className="w-full mt-2 py-2.5 bg-[#a16b9f] text-white rounded-xl text-sm font-medium hover:bg-[#8a5a88] transition-colors disabled:opacity-50"
                            >
                                {t("confirmBuyBtn") || "ดำเนินการต่อ"}
                            </button>
                        </div>
                    )}
                </Card>
            )}

            {/* Buy Confirmation Modal */}
            <Modal
                open={(!!selectedPkg && !showCustom) || openCustomModal}
                onClose={() => { setSelectedPkg(null); setShowCustom(false); setOpenCustomModal(false); }}
                title={t("confirmBuy")}
                confirmLabel={t("confirmBuyBtn")}
                onConfirm={handleConfirmBuy}
                loading={loading}
            >
                {(selectedPkg || showCustom) && (
                    <div className="space-y-4">
                        <div className="bg-[#f4f1de]/50 rounded-xl p-3">
                            <p className="font-bold text-[#3d405b]">
                                {showCustom ? `${t("customLabel")} · ${customCoins} ${t("coinsUnit")}` : selectedPkg?.label}
                            </p>
                            <p className="text-sm text-[#3d405b]/50">
                                {showCustom ? Number(customPrice).toLocaleString() : selectedPkg?.price} {t("baht")}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">{t("paymentMethod")}</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("CASH")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${paymentMethod === "CASH"
                                        ? "border-[#609279] bg-[#609279]/10 text-[#609279]"
                                        : "border-[#d1cce7]/30 text-[#3d405b]/50 hover:border-[#d1cce7]/60"
                                        }`}
                                >
                                    <Banknote size={16} />
                                    {t("cash")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("TRANSFER")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${paymentMethod === "TRANSFER"
                                        ? "border-[#a16b9f] bg-[#a16b9f]/10 text-[#a16b9f]"
                                        : "border-[#d1cce7]/30 text-[#3d405b]/50 hover:border-[#d1cce7]/60"
                                        }`}
                                >
                                    <CreditCard size={16} />
                                    {t("transfer")}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                {t("purchaseDate")} <span className="font-normal text-[#3d405b]/40">({t("purchaseDateHint")})</span>
                            </label>
                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                max={format(new Date(), "yyyy-MM-dd")}
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                            {purchaseDate !== format(new Date(), "yyyy-MM-dd") && (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ⏳ {t("purchaseDatePreview", { date: format(new Date(purchaseDate + "T00:00:00"), "d MMMM yyyy", { locale: dateLocale }) })}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                {t("noteLabel")} <span className="font-normal text-[#3d405b]/40">({t("noteOptional")})</span>
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t("notePlaceholder")}
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Use Coins */}
            {showUse && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">{t("useTitle")}</h3>
                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">{t("noCoins")}</p>
                    ) : pendingUse ? (
                        <div className="space-y-4">
                            <div className="bg-amber-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-amber-700">{t("confirmUse")}</p>
                                <p className="text-lg font-bold text-[#3d405b] mt-1">{pendingUse.label}</p>
                                <p className="text-sm text-amber-600 mt-1">{t("willDeduct", { coins: pendingUse.coins })}</p>
                            </div>
                            
                            <div className="bg-white border rounded-xl p-4">
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    {t("selectDateLabel", { fallback: "วันที่เรียน (Class Date)" })}
                                </label>
                                {fetchingClasses ? (
                                    <div className="flex items-center gap-2 text-sm text-[#3d405b]/50">
                                        <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                        กำลังโหลดตารางคลาส...
                                    </div>
                                ) : !pendingUse.isCustom && classOptions.length > 0 ? (
                                    <select
                                        value={selectedTargetDate}
                                        onChange={(e) => setSelectedTargetDate(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white"
                                    >
                                        <option value={format(new Date(), "yyyy-MM-dd")}>ใช้วันที่ปัจจุบัน ({format(new Date(), "d MMM yyyy", { locale: dateLocale })})</option>
                                        <optgroup label="ตารางคลาสที่บันทึกไว้">
                                            {classOptions.map((c) => {
                                                const d = new Date(c.date);
                                                return (
                                                    <option key={`${c.id}-${c.date}`} value={c.id}>
                                                        {format(d, "d MMM yyyy", { locale: dateLocale })} — {c.startTime}-{c.endTime} {c.teacherName ? `(T.${c.teacherName})` : ''}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    </select>
                                ) : (
                                    <input
                                        type="date"
                                        value={selectedTargetDate.split('T')[0]} // Handle ISO string fallback
                                        onChange={(e) => setSelectedTargetDate(e.target.value)}
                                        max={format(new Date(), "yyyy-MM-dd")}
                                        className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
                                    />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPendingUse(null)}
                                    className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm text-[#3d405b]/50 hover:bg-[#f4f1de]"
                                >
                                    {t("changeActivity")}
                                </button>
                                <button
                                    onClick={handleConfirmUse}
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {loading ? t("processing") : t("confirmUseBtn")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activities.map((act) => (
                                <button
                                    key={act.name}
                                    onClick={() => handleSelectActivity({ label: act.name, coins: act.coins, hours: 0 })}
                                    disabled={loading || activePackages.reduce((s, p) => s + p.remainingCoins, 0) < act.coins}
                                    className="w-full flex items-center justify-between p-3 border border-[#d1cce7]/30 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="text-sm text-[#3d405b]/80">{act.name}</span>
                                    <span className="text-sm font-semibold text-amber-600">{act.coins} {t("coinsUnit")}</span>
                                </button>
                            ))}

                            {!customActivity ? (
                                <button
                                    onClick={() => setCustomActivity(true)}
                                    className="w-full flex items-center justify-between p-3 border border-dashed border-[#d1cce7]/40 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/5 transition-all"
                                >
                                    <span className="text-sm text-[#3d405b]/50">{t("otherActivity")}</span>
                                    <span className="text-xs text-[#3d405b]/30">{t("custom")}</span>
                                </button>
                            ) : (
                                <div className="p-3 border border-[#81b29a] bg-[#81b29a]/5 rounded-xl space-y-3">
                                    <input
                                        type="text"
                                        value={customActivityName}
                                        onChange={(e) => setCustomActivityName(e.target.value)}
                                        placeholder={t("activityName")}
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                    />
                                    <input
                                        type="number"
                                        value={customActivityCoins}
                                        onChange={(e) => setCustomActivityCoins(e.target.value)}
                                        placeholder={t("coinsAmount")}
                                        min="1"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setCustomActivity(false); setCustomActivityName(""); setCustomActivityCoins(""); }}
                                            className="flex-1 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b]"
                                        >
                                            {"ยกเลิก / Cancel"}
                                        </button>
                                        <button
                                            onClick={() => handleSelectActivity({ label: customActivityName || t("otherActivity"), coins: parseInt(customActivityCoins) || 1, hours: 0, isCustom: true })}
                                            disabled={!customActivityCoins || parseInt(customActivityCoins) <= 0}
                                            className="flex-1 py-2 bg-[#609279] text-white rounded-lg text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50"
                                        >
                                            {t("select")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Extend Expiry */}
            {showExtend && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">{t("extendTitle")}</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        {t("extendDesc")}
                    </p>

                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">{t("noActivePackages")}</p>
                    ) : (
                        <div className="space-y-4">
                            {currentOverride && (
                                <div className="bg-[#a16b9f]/5 rounded-xl p-3">
                                    <p className="text-xs text-[#3d405b]/40 mb-1">{t("currentExpiry")}</p>
                                    <p className="text-sm font-bold text-[#a16b9f]">
                                        {format(currentOverride, "d MMMM yyyy", { locale: dateLocale })}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    {t("newExpiryDate")}
                                </label>
                                <DateInput
                                    value={extendDate}
                                    onChange={(val) => setExtendDate(val)}
                                    min={format(new Date(), "yyyy-MM-dd")}
                                    yearForward={3}
                                />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: t("days30"), days: 30 },
                                    { label: t("days60"), days: 60 },
                                    { label: t("days90"), days: 90 },
                                ].map((opt) => (
                                    <button
                                        key={opt.days}
                                        type="button"
                                        onClick={() => {
                                            const base = currentOverride || new Date();
                                            const d = new Date(base);
                                            d.setDate(d.getDate() + opt.days);
                                            setExtendDate(format(d, "yyyy-MM-dd"));
                                        }}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f4f1de] text-[#3d405b]/60 hover:bg-[#a16b9f]/10 hover:text-[#a16b9f] transition-all"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {extendDate && (
                                <div className="bg-emerald-50 rounded-xl p-3 text-sm">
                                    <p className="text-emerald-600 font-medium">
                                        ✓ {t("expiryPreview", { date: format(new Date(extendDate), "d MMMM yyyy", { locale: dateLocale }) })}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    {t("noteLabel")} <span className="font-normal text-[#3d405b]/40">({t("noteOptional")})</span>
                                </label>
                                <input
                                    type="text"
                                    value={extendNote}
                                    onChange={(e) => setExtendNote(e.target.value)}
                                    placeholder={t("extendReason")}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                />
                            </div>

                            <button
                                onClick={handleExtend}
                                disabled={loading || !extendDate}
                                className="w-full py-2.5 bg-[#a16b9f] text-white rounded-xl text-sm font-medium hover:bg-[#8a5a88] transition-colors disabled:opacity-50"
                            >
                                {loading ? t("processing") : t("confirmExtend")}
                            </button>
                        </div>
                    )}
                </Card>
            )}

            {/* Adjust Up Coins */}
            {showAdjustUp && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">{t("adjustUpTitle")}</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        {t("adjustUpDesc")}
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">{t("addCoinsLabel")}</label>
                            <input
                                type="number"
                                value={addAmount}
                                onChange={(e) => setAddAmount(e.target.value)}
                                placeholder="5"
                                min="1"
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                {t("reasonLabel")} <span className="font-normal text-[#3d405b]/40">({t("noteOptional")})</span>
                            </label>
                            <input
                                type="text"
                                value={addReason}
                                onChange={(e) => setAddReason(e.target.value)}
                                placeholder={t("addPlaceholder")}
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                        {addAmount && parseInt(addAmount) > 0 && (
                            <div className="bg-blue-50 rounded-xl p-3 text-sm">
                                <p className="text-blue-600 font-medium">
                                    ✓ {t("addPreview", { amount: addAmount })}
                                </p>
                                {addReason && (
                                    <p className="text-xs text-blue-400 mt-1">{t("reasonPrefix", { reason: addReason })}</p>
                                )}
                            </div>
                        )}
                        <button
                            onClick={handleAdjustUp}
                            disabled={loading || !addAmount || parseInt(addAmount) <= 0}
                            className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? t("processing") : t("confirmAdd")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Deduct Coins */}
            {showDeduct && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">{t("deductTitle")}</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        {t("deductDesc")}
                    </p>

                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">{t("noCoins")}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-[#f4f1de]/50 rounded-xl p-3">
                                <p className="text-xs text-[#3d405b]/40 mb-1">{t("remainingCoins")}</p>
                                <p className="text-lg font-bold text-emerald-600">
                                    {activePackages.reduce((s, p) => s + p.remainingCoins, 0)} {t("coinsUnit")}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">{t("deductLabel")}</label>
                                <input
                                    type="number"
                                    value={deductAmount}
                                    onChange={(e) => setDeductAmount(e.target.value)}
                                    placeholder="3"
                                    min="1"
                                    max={activePackages.reduce((s, p) => s + p.remainingCoins, 0)}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    {t("reasonLabel")} <span className="font-normal text-[#3d405b]/40">({t("noteOptional")})</span>
                                </label>
                                <input
                                    type="text"
                                    value={deductReason}
                                    onChange={(e) => setDeductReason(e.target.value)}
                                    placeholder={t("deductPlaceholder")}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    {t("purchaseDate")}
                                </label>
                                <input
                                    type="date"
                                    value={deductDate}
                                    onChange={(e) => setDeductDate(e.target.value)}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                            </div>

                            {deductAmount && parseInt(deductAmount) > 0 && (
                                <div className="bg-red-50 rounded-xl p-3 text-sm">
                                    <p className="text-red-600 font-medium">
                                        ⚠️ {t("deductPreview", { amount: deductAmount })}
                                    </p>
                                    {deductReason && (
                                        <p className="text-xs text-red-400 mt-1">{t("reasonPrefix", { reason: deductReason })}</p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleDeduct}
                                disabled={loading || !deductAmount || parseInt(deductAmount) <= 0}
                                className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? t("processing") : t("confirmDeduct")}
                            </button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
