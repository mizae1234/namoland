"use client";

import { useState } from "react";
import { purchasePackage, useCoins } from "@/actions/coin";
import { Coins, ShoppingCart } from "lucide-react";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";

interface MemberActionsProps {
    member: {
        id: string;
        coinPackages: Array<{
            id: string;
            packageType: string;
            remainingCoins: number;
            isExpired: boolean;
        }>;
    };
}

const PACKAGES = [
    { type: "5_COINS", label: "5 เหรียญ", price: "1,000", coins: 5, bonus: "-" },
    { type: "10_COINS", label: "10 เหรียญ", price: "1,900", coins: 10, bonus: "ประหยัด 100" },
    { type: "20_COINS", label: "20 เหรียญ", price: "3,700", coins: 20, bonus: "ประหยัด 300" },
    { type: "30_COINS", label: "30 เหรียญ", price: "5,400", coins: 30, bonus: "ประหยัด 600" },
];

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
    { label: "Book Rental (5 เล่ม)", coins: 1, hours: 0 },
];

export default function MemberActions({ member }: MemberActionsProps) {
    const [showBuy, setShowBuy] = useState(false);
    const [showUse, setShowUse] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const activePackages = member.coinPackages.filter(
        (p) => !p.isExpired && p.remainingCoins > 0
    );

    const handleBuy = async (packageType: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("userId", member.id);
        fd.set("packageType", packageType);
        const result = await purchasePackage(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage("ซื้อเหรียญสำเร็จ!");
            setShowBuy(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleUse = async (
        packageId: string,
        coins: number,
        className: string,
        hours: number
    ) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("packageId", packageId);
        fd.set("coinsUsed", String(coins));
        fd.set("className", className);
        fd.set("classHours", String(hours));
        const result = await useCoins(fd);
        setLoading(false);
        if (result.error) setMessage(result.error);
        else {
            setMessage("ใช้เหรียญสำเร็จ!");
            setShowUse(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div className="mb-6">
            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
            />

            <div className="flex gap-3 mb-4">
                <button
                    onClick={() => { setShowBuy(!showBuy); setShowUse(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200"
                >
                    <ShoppingCart size={16} />
                    ซื้อเหรียญ
                </button>
                <button
                    onClick={() => { setShowUse(!showUse); setShowBuy(false); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-md shadow-amber-200"
                >
                    <Coins size={16} />
                    ใช้เหรียญ
                </button>
            </div>

            {/* Buy Package Modal */}
            {showBuy && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-slate-800 mb-4">เลือกแพ็คเกจเหรียญ</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {PACKAGES.map((pkg) => (
                            <button
                                key={pkg.type}
                                onClick={() => handleBuy(pkg.type)}
                                disabled={loading}
                                className="p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                            >
                                <p className="font-bold text-slate-800">{pkg.label}</p>
                                <p className="text-sm text-slate-500">{pkg.price} บาท</p>
                                {pkg.bonus !== "-" && (
                                    <p className="text-xs text-emerald-500 mt-1">{pkg.bonus}</p>
                                )}
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Use Coins Modal */}
            {showUse && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-slate-800 mb-4">ใช้เหรียญ — เลือกกิจกรรม</h3>
                    {activePackages.length === 0 ? (
                        <p className="text-sm text-slate-400">ไม่มีเหรียญคงเหลือ</p>
                    ) : (
                        <div className="space-y-2">
                            {CLASS_OPTIONS.map((cls) => (
                                <button
                                    key={cls.label}
                                    onClick={() =>
                                        handleUse(activePackages[0].id, cls.coins, cls.label, cls.hours)
                                    }
                                    disabled={loading || activePackages[0].remainingCoins < cls.coins}
                                    className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span className="text-sm text-slate-700">{cls.label}</span>
                                    <span className="text-sm font-semibold text-amber-600">{cls.coins} เหรียญ</span>
                                </button>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
