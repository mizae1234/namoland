"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AlertMessage from "@/components/ui/AlertMessage";

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/user";
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("user-login", {
            phone,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง");
            setLoading(false);
        } else {
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl text-white text-2xl font-bold shadow-lg shadow-blue-200 mb-3">
                        N
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Namoland</h1>
                    <p className="text-slate-500 text-sm mt-1">เข้าสู่ระบบสมาชิก</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <AlertMessage message={error} className="text-center" />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08x-xxx-xxxx"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all text-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all text-lg"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1.5">
                                รหัสผ่านเริ่มต้น: 4 ตัวท้ายของเบอร์โทร
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all disabled:opacity-50"
                    >
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-4">
                    ยังไม่มีบัญชี?{" "}
                    <a
                        href={`/user/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="text-blue-500 font-medium hover:text-blue-700"
                    >
                        สมัครสมาชิก
                    </a>
                </p>
            </div>
        </div>
    );
}
