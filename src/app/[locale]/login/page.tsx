"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogIn, Eye, EyeOff } from "lucide-react";
import AlertMessage from "@/components/ui/AlertMessage";
import Image from "next/image";

export default function LoginPage() {
    const t = useTranslations("AdminAuth");
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
                setError(t("error.invalid"));
            } else {
                router.push("/classes");
            }
        } catch {
            setError(t("error.system"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f1de] via-white to-[#d1cce7]/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <Image src="/namoland-logo.png" alt="NAMOLAND" width={64} height={64} className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-[#a16b9f]/20" />
                    <h1 className="text-2xl font-bold text-[#3d405b]">NAMOLAND</h1>
                    <p className="text-[#3d405b]/50 mt-1">{t("subtitle")}</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-[#a16b9f]/10 p-8 border border-[#d1cce7]/20">
                    <h2 className="text-xl font-semibold text-[#3d405b] mb-6">{t("title")}</h2>

                    <AlertMessage message={error} />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-2">{t("email")}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#a16b9f] focus:ring-2 focus:ring-[#a16b9f]/20 outline-none transition-all"
                                placeholder="admin@namoland.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-2">{t("password")}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#a16b9f] focus:ring-2 focus:ring-[#a16b9f]/20 outline-none transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d405b]/40 hover:text-[#3d405b]/70"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#609279] to-[#a16b9f] hover:from-[#81b29a] hover:to-[#a16b9f] text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#a16b9f]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    {t("loginBtn")}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-[#3d405b]/40 mt-6">
                    {t("copyright", { year: new Date().getFullYear() })}
                </p>
            </div>
        </div>
    );
}
