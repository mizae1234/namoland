"use client";

import { useState } from "react";
import { registerUser } from "@/actions/register";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import AlertMessage from "@/components/ui/AlertMessage";

export default function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/user";

    const [parentName, setParentName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [children, setChildren] = useState<{ name: string; birthDate: string }[]>([]);
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
        setError("");
        setLoading(true);

        const fd = new FormData();
        fd.set("parentName", parentName);
        fd.set("phone", phone);
        fd.set("password", password);
        if (children.length > 0) {
            fd.set("children", JSON.stringify(children));
        }

        const result = await registerUser(fd);

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        // Auto login after registration
        const loginResult = await signIn("user-login", {
            phone,
            password,
            redirect: false,
        });

        if (loginResult?.error) {
            setError("สมัครสำเร็จ แต่ login ไม่ได้ กรุณา login ด้วยตัวเอง");
            setLoading(false);
            return;
        }

        router.push(callbackUrl);
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f1de] via-[#f4f1de] to-[#d1cce7]/20 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#3d405b] to-[#609279] rounded-2xl text-white text-2xl font-bold shadow-lg shadow-[#81b29a]/30 mb-3">
                        N
                    </div>
                    <h1 className="text-xl font-bold text-[#3d405b]">Namoland</h1>
                    <p className="text-[#3d405b]/50 text-sm mt-1">สมัครสมาชิก</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#d1cce7]/20">
                    <AlertMessage message={error} />

                    <div className="space-y-4">
                        {/* Parent Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-1">
                                ชื่อผู้ปกครอง *
                            </label>
                            <input
                                type="text"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                placeholder="ชื่อ-นามสกุล"
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-1">
                                เบอร์โทรศัพท์ *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08x-xxx-xxxx"
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none transition-all text-lg"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-1">
                                รหัสผ่าน *
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="อย่างน้อย 4 ตัว"
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none transition-all"
                                required
                                minLength={4}
                            />
                        </div>
                    </div>

                    {/* Children (optional) */}
                    <div className="mt-6 pt-4 border-t border-[#d1cce7]/20">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-[#3d405b]/70">
                                ข้อมูลเด็ก <span className="text-[#3d405b]/40">(ไม่บังคับ)</span>
                            </p>
                            <button
                                type="button"
                                onClick={addChild}
                                className="text-xs text-[#609279] flex items-center gap-1 hover:text-[#609279]"
                            >
                                <Plus size={14} /> เพิ่ม
                            </button>
                        </div>

                        {children.map((child, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={child.name}
                                    onChange={(e) => updateChild(i, "name", e.target.value)}
                                    placeholder="ชื่อเด็ก"
                                    className="flex-1 px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none"
                                />
                                <input
                                    type="date"
                                    value={child.birthDate}
                                    onChange={(e) => updateChild(i, "birthDate", e.target.value)}
                                    className="px-3 py-2 border border-[#d1cce7]/30 rounded-lg text-sm focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeChild(i)}
                                    className="text-red-400 hover:text-red-600 px-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-gradient-to-r from-[#3d405b] to-[#609279] text-white rounded-xl font-semibold shadow-lg shadow-[#81b29a]/30 hover:shadow-xl hover:shadow-[#81b29a]/30 transition-all disabled:opacity-50"
                    >
                        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
                    </button>
                </form>

                <p className="text-center text-sm text-[#3d405b]/50 mt-4">
                    มีบัญชีอยู่แล้ว?{" "}
                    <a
                        href={`/user/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="text-[#609279] font-medium hover:text-[#609279]"
                    >
                        เข้าสู่ระบบ
                    </a>
                </p>
            </div>
        </div>
    );
}
