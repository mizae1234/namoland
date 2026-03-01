"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff } from "lucide-react";
import AlertMessage from "@/components/ui/AlertMessage";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("admin-login", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-200">
                        <span className="text-white text-2xl font-bold">N</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Namoland</h1>
                    <p className="text-slate-500 mt-1">ระบบจัดการนโมแลนด์</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">เข้าสู่ระบบ Admin</h2>

                    <AlertMessage message={error} />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">อีเมล</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="admin@namoland.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">รหัสผ่าน</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    เข้าสู่ระบบ
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2026 Namoland. All rights reserved.
                </p>
            </div>
        </div>
    );
}
