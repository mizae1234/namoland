"use client";

import { useState } from "react";
import { createMember } from "@/actions/member";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import DateInput from "@/components/ui/DateInput";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";

export default function NewMemberPage() {
    const router = useRouter();
    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [children, setChildren] = useState([{ name: "", birthDate: "" }]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const addChild = () => setChildren([...children, { name: "", birthDate: "" }]);
    const removeChild = (i: number) => setChildren(children.filter((_, idx) => idx !== i));
    const updateChild = (i: number, field: string, value: string) => {
        const updated = [...children];
        updated[i] = { ...updated[i], [field]: value };
        setChildren(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const validChildren = children.filter((c) => c.name && c.birthDate);

        const formData = new FormData();
        formData.set("parentName", parentName);
        formData.set("phone", phone);
        formData.set("children", JSON.stringify(validChildren));

        const result = await createMember(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/members");
        }
    };

    return (
        <div className="max-w-2xl">
            <BackLink href="/members" label="กลับไปหน้าสมาชิก" />

            <h1 className="text-2xl font-bold text-[#3d405b] mb-6">เพิ่มสมาชิกใหม่</h1>

            <AlertMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="space-y-4">
                    <h2 className="font-semibold text-[#3d405b]/80">ข้อมูลผู้ปกครอง</h2>
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">ชื่อผู้ปกครอง</label>
                        <input
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">เบอร์โทรศัพท์</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm"
                            placeholder="08x-xxx-xxxx"
                            required
                        />
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-[#3d405b]/80">ข้อมูลเด็ก</h2>
                        <button
                            type="button"
                            onClick={addChild}
                            className="flex items-center gap-1 text-sm text-[#609279] hover:text-[#609279] font-medium"
                        >
                            <Plus size={16} /> เพิ่มเด็ก
                        </button>
                    </div>

                    <div className="space-y-4">
                        {children.map((child, i) => (
                            <div key={i} className="flex gap-3 items-end bg-[#f4f1de]/50 p-4 rounded-xl">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-[#3d405b]/50 mb-1">ชื่อเด็ก</label>
                                    <input
                                        type="text"
                                        value={child.name}
                                        onChange={(e) => updateChild(i, "name", e.target.value)}
                                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-lg bg-white text-sm focus:border-[#81b29a] outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-[#3d405b]/50 mb-1">วันเกิด</label>
                                    <DateInput
                                        value={child.birthDate}
                                        onChange={(val) => updateChild(i, "birthDate", val)}
                                        yearBack={20}
                                    />
                                </div>
                                {children.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeChild(i)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50"
                >
                    {loading ? "กำลังบันทึก..." : "บันทึกสมาชิก"}
                </button>
            </form>
        </div>
    );
}
