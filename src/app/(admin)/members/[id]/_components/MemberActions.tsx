"use client";

import { useState } from "react";
import { purchasePackage, spendCoins, extendExpiry, deductCoins, adjustCoinsUp } from "@/actions/coin";
import { Coins, ShoppingCart, Banknote, CreditCard, CalendarPlus, MinusCircle, PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import DateInput from "@/components/ui/DateInput";

interface PackageOption {
    type: string;
    label: string;
    price: string;
    coins: number;
    bonus: string;
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
}

const CLASS_OPTIONS = [
    { label: "Free Play (1 ชม.)", coins: 1, hours: 1 },
    { label: "Little Explorers (1.5 ชม.)", coins: 1, hours: 1.5 },
    { label: "Private Grow to Glow (2 ชม.)", coins: 3, hours: 2 },
    { label: "Jolly Designer (2 ชม.)", coins: 5, hours: 2 },
    { label: "Summer Camp – Full day", coins: 6, hours: 8 },
    { label: "Little Artist", coins: 13, hours: 8 },
    { label: "Summer/Camp – Half day", coins: 6, hours: 4 },
    { label: "Inspire Hour – Fashion/Product Design", coins: 1, hours: 1 },
    { label: "Sensory Play", coins: 1, hours: 1 },
    { label: "Book Rental", coins: 1, hours: 0 },
];

export default function MemberActions({ member, packages }: MemberActionsProps) {
    const [showBuy, setShowBuy] = useState(false);
    const [showUse, setShowUse] = useState(false);
    const [showExtend, setShowExtend] = useState(false);
    const [showDeduct, setShowDeduct] = useState(false);
    const [showAdjustUp, setShowAdjustUp] = useState(false);
    const [loading, setLoading] = useState(false);

    // Use coins confirm state
    const [pendingUse, setPendingUse] = useState<{ coins: number; label: string; hours: number } | null>(null);
    const [customActivity, setCustomActivity] = useState(false);
    const [customActivityName, setCustomActivityName] = useState("");
    const [customActivityCoins, setCustomActivityCoins] = useState("");
    const [message, setMessage] = useState("");

    // Deduct state
    const [deductAmount, setDeductAmount] = useState("");
    const [deductReason, setDeductReason] = useState("");

    // Adjust up state
    const [addAmount, setAddAmount] = useState("");
    const [addReason, setAddReason] = useState("");

    // Buy confirmation state
    const [selectedPkg, setSelectedPkg] = useState<PackageOption | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
    const [note, setNote] = useState("");

    // Custom purchase state
    const [showCustom, setShowCustom] = useState(false);
    const [customCoins, setCustomCoins] = useState("");
    const [customPrice, setCustomPrice] = useState("");

    // Extend state — date picker
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
        setSelectedPkg({ type: "CUSTOM", label: "กำหนดเอง", price: customPrice || "0", coins: parseInt(customCoins) || 0, bonus: "-" });
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
        const result = await purchasePackage(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage("ซื้อเหรียญสำเร็จ!");
            setSelectedPkg(null);
            setShowBuy(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleSelectActivity = (cls: { coins: number; label: string; hours: number }) => {
        setPendingUse(cls);
        setCustomActivity(false);
    };

    const handleConfirmUse = async () => {
        if (!pendingUse) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("packageId", activePackages[0].id);
        fd.set("coinsUsed", String(pendingUse.coins));
        fd.set("className", pendingUse.label);
        fd.set("classHours", String(pendingUse.hours));
        const result = await spendCoins(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage("ใช้เหรียญสำเร็จ!");
            setShowUse(false);
            setPendingUse(null);
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
            setMessage("ขยายเวลาสำเร็จ!");
            setShowExtend(false);
            setExtendNote("");
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
        const result = await deductCoins(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage("ปรับลดเหรียญสำเร็จ!");
            setShowDeduct(false);
            setDeductAmount("");
            setDeductReason("");
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
            setMessage("ปรับเพิ่มเหรียญสำเร็จ!");
            setShowAdjustUp(false);
            setAddAmount("");
            setAddReason("");
            setTimeout(() => setMessage(""), 3000);
        }
    };


    return (
        <div className="mb-6">
            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
            />

            <div className="flex gap-3 mb-4 flex-wrap">
                <button
                    onClick={() => { closeAll(); setShowBuy(!showBuy); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200"
                >
                    <ShoppingCart size={16} />
                    ซื้อเหรียญ
                </button>
                <button
                    onClick={() => { closeAll(); setShowUse(!showUse); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-md shadow-amber-200"
                >
                    <Coins size={16} />
                    ใช้เหรียญ
                </button>
                <button
                    onClick={() => { closeAll(); setShowExtend(!showExtend); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#a16b9f] text-white rounded-xl text-sm font-medium hover:bg-[#8a5a88] transition-colors shadow-md shadow-[#a16b9f]/30"
                >
                    <CalendarPlus size={16} />
                    ขยายเวลา
                </button>
                <button
                    onClick={() => { closeAll(); setShowAdjustUp(!showAdjustUp); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                >
                    <PlusCircle size={16} />
                    ปรับเพิ่มเหรียญ
                </button>
                <button
                    onClick={() => { closeAll(); setShowDeduct(!showDeduct); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors shadow-md shadow-red-200"
                >
                    <MinusCircle size={16} />
                    ปรับลดเหรียญ
                </button>
                <Link
                    href={`/borrows/new/${member.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4a7a5f] transition-colors shadow-md shadow-[#81b29a]/30"
                >
                    <BookOpen size={16} />
                    ยืมหนังสือ
                </Link>
            </div>

            {/* Buy Package */}
            {showBuy && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">เลือกแพ็คเกจเหรียญ</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.type}
                                onClick={() => handleSelectPackage(pkg)}
                                disabled={loading}
                                className="p-4 border-2 border-[#d1cce7]/30 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/10 transition-all text-left disabled:opacity-50"
                            >
                                <p className="font-bold text-[#3d405b]">{pkg.label}</p>
                                <p className="text-sm text-[#3d405b]/50">{pkg.price} บาท</p>
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
                            <p className="font-bold text-[#a16b9f]">✏️ กำหนดเอง</p>
                            <p className="text-xs text-[#3d405b]/40">ใส่จำนวนเหรียญและราคาเอง</p>
                        </button>
                    </div>
                    {showCustom && (
                        <div className="mt-4 space-y-3 bg-[#a16b9f]/5 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-[#3d405b] block mb-1">จำนวนเหรียญ</label>
                                    <input
                                        type="number"
                                        value={customCoins}
                                        onChange={(e) => setCustomCoins(e.target.value)}
                                        placeholder="เช่น 15"
                                        min="1"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#3d405b] block mb-1">ราคา (บาท)</label>
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        placeholder="เช่น 2500"
                                        min="0"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                    />
                                </div>
                            </div>
                            {customCoins && customPrice && (
                                <p className="text-xs text-[#a16b9f] font-medium">
                                    ✓ {customCoins} เหรียญ · {Number(customPrice).toLocaleString()} บาท
                                </p>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Buy Confirmation Modal */}
            <Modal
                open={!!selectedPkg && !showCustom || (showCustom && !!customCoins && !!customPrice)}
                onClose={() => { setSelectedPkg(null); setShowCustom(false); }}
                title="ยืนยันซื้อเหรียญ"
                confirmLabel="ยืนยันซื้อ"
                onConfirm={handleConfirmBuy}
                loading={loading}
            >
                {(selectedPkg || showCustom) && (
                    <div className="space-y-4">
                        <div className="bg-[#f4f1de]/50 rounded-xl p-3">
                            <p className="font-bold text-[#3d405b]">
                                {showCustom ? `กำหนดเอง · ${customCoins} เหรียญ` : selectedPkg?.label}
                            </p>
                            <p className="text-sm text-[#3d405b]/50">
                                {showCustom ? Number(customPrice).toLocaleString() : selectedPkg?.price} บาท
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">ชำระเงินแบบ</label>
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
                                    เงินสด
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
                                    เงินโอน
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                หมายเหตุ <span className="font-normal text-[#3d405b]/40">(ไม่บังคับ)</span>
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="เช่น รับสลิปแล้ว, ชำระพร้อมค่าเรียน..."
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Use Coins */}
            {showUse && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">ใช้เหรียญ — เลือกกิจกรรม</h3>
                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">ไม่มีเหรียญคงเหลือ</p>
                    ) : pendingUse ? (
                        /* Confirm Step */
                        <div className="space-y-4">
                            <div className="bg-amber-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-amber-700">ยืนยันการใช้เหรียญ</p>
                                <p className="text-lg font-bold text-[#3d405b] mt-1">{pendingUse.label}</p>
                                <p className="text-sm text-amber-600 mt-1">จะหัก {pendingUse.coins} เหรียญ</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPendingUse(null)}
                                    className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm text-[#3d405b]/50 hover:bg-[#f4f1de]"
                                >
                                    เปลี่ยนกิจกรรม
                                </button>
                                <button
                                    onClick={handleConfirmUse}
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {loading ? "กำลังดำเนินการ..." : "ยืนยันใช้เหรียญ"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {CLASS_OPTIONS.map((cls) => (
                                <button
                                    key={cls.label}
                                    onClick={() => handleSelectActivity(cls)}
                                    disabled={loading || activePackages.reduce((s, p) => s + p.remainingCoins, 0) < cls.coins}
                                    className="w-full flex items-center justify-between p-3 border border-[#d1cce7]/30 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="text-sm text-[#3d405b]/80">{cls.label}</span>
                                    <span className="text-sm font-semibold text-amber-600">{cls.coins} เหรียญ</span>
                                </button>
                            ))}

                            {/* Custom Activity */}
                            {!customActivity ? (
                                <button
                                    onClick={() => setCustomActivity(true)}
                                    className="w-full flex items-center justify-between p-3 border border-dashed border-[#d1cce7]/40 rounded-xl hover:border-[#81b29a] hover:bg-[#81b29a]/5 transition-all"
                                >
                                    <span className="text-sm text-[#3d405b]/50">รายการอื่นๆ...</span>
                                    <span className="text-xs text-[#3d405b]/30">กำหนดเอง</span>
                                </button>
                            ) : (
                                <div className="p-3 border border-[#81b29a] bg-[#81b29a]/5 rounded-xl space-y-3">
                                    <input
                                        type="text"
                                        value={customActivityName}
                                        onChange={(e) => setCustomActivityName(e.target.value)}
                                        placeholder="ชื่อกิจกรรม/รายการ"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                    />
                                    <input
                                        type="number"
                                        value={customActivityCoins}
                                        onChange={(e) => setCustomActivityCoins(e.target.value)}
                                        placeholder="จำนวนเหรียญ"
                                        min="1"
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setCustomActivity(false); setCustomActivityName(""); setCustomActivityCoins(""); }}
                                            className="flex-1 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b]"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            onClick={() => handleSelectActivity({ label: customActivityName || "อื่นๆ", coins: parseInt(customActivityCoins) || 1, hours: 0 })}
                                            disabled={!customActivityCoins || parseInt(customActivityCoins) <= 0}
                                            className="flex-1 py-2 bg-[#609279] text-white rounded-lg text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50"
                                        >
                                            เลือก
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Extend Expiry — Member Level */}
            {showExtend && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">ขยายเวลาหมดอายุ</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        ตั้งวันหมดอายุรวมสำหรับสมาชิกคนนี้ — ทุกแพ็คเกจจะหมดพร้อมกัน
                    </p>

                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">ไม่มีแพ็คเกจที่ active</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Current expiry info */}
                            {currentOverride && (
                                <div className="bg-[#a16b9f]/5 rounded-xl p-3">
                                    <p className="text-xs text-[#3d405b]/40 mb-1">วันหมดอายุปัจจุบัน (ที่ตั้งไว้)</p>
                                    <p className="text-sm font-bold text-[#a16b9f]">
                                        {format(currentOverride, "d MMMM yyyy", { locale: th })}
                                    </p>
                                </div>
                            )}

                            {/* Date picker */}
                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    เลือกวันหมดอายุใหม่
                                </label>
                                <DateInput
                                    value={extendDate}
                                    onChange={(val) => setExtendDate(val)}
                                    min={format(new Date(), "yyyy-MM-dd")}
                                    yearForward={3}
                                />
                            </div>

                            {/* Quick presets */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: "+30 วัน", days: 30 },
                                    { label: "+60 วัน", days: 60 },
                                    { label: "+90 วัน", days: 90 },
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

                            {/* Preview */}
                            {extendDate && (
                                <div className="bg-emerald-50 rounded-xl p-3 text-sm">
                                    <p className="text-emerald-600 font-medium">
                                        ✓ เหรียญทั้งหมดจะหมดอายุวันที่ {format(new Date(extendDate), "d MMMM yyyy", { locale: th })}
                                    </p>
                                </div>
                            )}

                            {/* Note */}
                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    หมายเหตุ <span className="font-normal text-[#3d405b]/40">(ไม่บังคับ)</span>
                                </label>
                                <input
                                    type="text"
                                    value={extendNote}
                                    onChange={(e) => setExtendNote(e.target.value)}
                                    placeholder="เหตุผลที่ขยายเวลา..."
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a16b9f]/20 focus:border-[#a16b9f]"
                                />
                            </div>

                            {/* Confirm */}
                            <button
                                onClick={handleExtend}
                                disabled={loading || !extendDate}
                                className="w-full py-2.5 bg-[#a16b9f] text-white rounded-xl text-sm font-medium hover:bg-[#8a5a88] transition-colors disabled:opacity-50"
                            >
                                {loading ? "กำลังดำเนินการ..." : "ยืนยันตั้งวันหมดอายุ"}
                            </button>
                        </div>
                    )}
                </Card>
            )}

            {/* Adjust Up Coins */}
            {showAdjustUp && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">ปรับเพิ่มเหรียญ</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        ระบุจำนวนเหรียญที่ต้องการเพิ่ม และเหตุผล — ระบบจะเพิ่มเข้าแพ็คเกจเก่าสุดที่ active
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">จำนวนเหรียญที่จะเพิ่ม</label>
                            <input
                                type="number"
                                value={addAmount}
                                onChange={(e) => setAddAmount(e.target.value)}
                                placeholder="เช่น 5"
                                min="1"
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                เหตุผล <span className="font-normal text-[#3d405b]/40">(ไม่บังคับ)</span>
                            </label>
                            <input
                                type="text"
                                value={addReason}
                                onChange={(e) => setAddReason(e.target.value)}
                                placeholder="เช่น ชดเชยเหรียญ, โปรโมชั่นพิเศษ..."
                                className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                        {addAmount && parseInt(addAmount) > 0 && (
                            <div className="bg-blue-50 rounded-xl p-3 text-sm">
                                <p className="text-blue-600 font-medium">
                                    ✓ จะเพิ่ม {addAmount} เหรียญ ให้สมาชิกคนนี้
                                </p>
                                {addReason && (
                                    <p className="text-xs text-blue-400 mt-1">เหตุผล: {addReason}</p>
                                )}
                            </div>
                        )}
                        <button
                            onClick={handleAdjustUp}
                            disabled={loading || !addAmount || parseInt(addAmount) <= 0}
                            className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? "กำลังดำเนินการ..." : "ยืนยันเพิ่มเหรียญ"}
                        </button>
                    </div>
                </Card>
            )}

            {/* Deduct Coins */}
            {showDeduct && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-2">ปรับลดเหรียญ</h3>
                    <p className="text-xs text-[#3d405b]/40 mb-4">
                        ระบุจำนวนเหรียญที่ต้องการตัดออก และเหตุผล — ระบบจะตัดจากแพ็คเกจเก่าสุดก่อนอัตโนมัติ
                    </p>

                    {activePackages.length === 0 ? (
                        <p className="text-sm text-[#3d405b]/40">ไม่มีเหรียญคงเหลือ</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Current balance */}
                            <div className="bg-[#f4f1de]/50 rounded-xl p-3">
                                <p className="text-xs text-[#3d405b]/40 mb-1">เหรียญคงเหลือ</p>
                                <p className="text-lg font-bold text-emerald-600">
                                    {activePackages.reduce((s, p) => s + p.remainingCoins, 0)} เหรียญ
                                </p>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">จำนวนเหรียญที่จะตัด</label>
                                <input
                                    type="number"
                                    value={deductAmount}
                                    onChange={(e) => setDeductAmount(e.target.value)}
                                    placeholder="เช่น 3"
                                    min="1"
                                    max={activePackages.reduce((s, p) => s + p.remainingCoins, 0)}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="text-sm font-medium text-[#3d405b] block mb-2">
                                    เหตุผล <span className="font-normal text-[#3d405b]/40">(ไม่บังคับ)</span>
                                </label>
                                <input
                                    type="text"
                                    value={deductReason}
                                    onChange={(e) => setDeductReason(e.target.value)}
                                    placeholder="เช่น แก้ไขยอดเหรียญ, คืนค่าเรียนผิด..."
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                                />
                            </div>

                            {/* Preview */}
                            {deductAmount && parseInt(deductAmount) > 0 && (
                                <div className="bg-red-50 rounded-xl p-3 text-sm">
                                    <p className="text-red-600 font-medium">
                                        ⚠️ จะตัด {deductAmount} เหรียญ จากสมาชิกคนนี้
                                    </p>
                                    {deductReason && (
                                        <p className="text-xs text-red-400 mt-1">เหตุผล: {deductReason}</p>
                                    )}
                                </div>
                            )}

                            {/* Confirm */}
                            <button
                                onClick={handleDeduct}
                                disabled={loading || !deductAmount || parseInt(deductAmount) <= 0}
                                className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? "กำลังดำเนินการ..." : "ยืนยันตัดเหรียญ"}
                            </button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
