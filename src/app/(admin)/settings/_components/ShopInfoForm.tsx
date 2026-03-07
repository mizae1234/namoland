"use client";

import { useState } from "react";
import { updateShopInfo } from "@/actions/shop";
import { Save, Store, Building2 } from "lucide-react";
import Card from "@/components/ui/Card";

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
            setMessage("บันทึกสำเร็จ");
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
                    <h2 className="font-semibold text-[#3d405b]">ข้อมูลร้าน</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">ชื่อร้าน</label>
                        <input
                            name="shopName"
                            defaultValue={shopInfo.shopName}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder="ชื่อร้าน"
                        />
                    </div>
                </div>
            </Card>

            {/* Bank Account */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <Building2 size={18} className="text-emerald-500" />
                    <h2 className="font-semibold text-[#3d405b]">บัญชีธนาคาร</h2>
                </div>
                <p className="text-xs text-[#3d405b]/40 mb-4">ข้อมูลนี้จะแสดงให้ user เห็นตอนเติมเหรียญ</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">ชื่อธนาคาร</label>
                        <input
                            name="bankName"
                            defaultValue={shopInfo.bankName || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder="เช่น ธนาคารกสิกรไทย"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">เลขบัญชี</label>
                        <input
                            name="accountNumber"
                            defaultValue={shopInfo.accountNumber || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder="xxx-x-xxxxx-x"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">ชื่อบัญชี</label>
                        <input
                            name="accountName"
                            defaultValue={shopInfo.accountName || ""}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm"
                            placeholder="ชื่อเจ้าของบัญชี"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#3d405b]/70 mb-1 block">หมายเหตุ</label>
                        <textarea
                            name="note"
                            defaultValue={shopInfo.note || ""}
                            rows={2}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] text-sm resize-none"
                            placeholder="เช่น โอนแล้วแจ้งทาง LINE"
                        />
                    </div>
                </div>
            </Card>

            {/* Save Button */}
            {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message === "บันทึกสำเร็จ" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {message}
                </div>
            )}
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
                <Save size={18} />
                {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
        </form>
    );
}
