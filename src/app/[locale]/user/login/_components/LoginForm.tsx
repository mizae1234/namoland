"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AlertMessage from "@/components/ui/AlertMessage";
import Image from "next/image";

export default function LoginForm() {
    const t = useTranslations("UserAuth.Login");
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
            setError(t("error.invalid"));
            setLoading(false);
        } else {
            router.push(callbackUrl);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f4f1de] via-[#f4f1de] to-[#d1cce7]/20 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Image src="/namoland-logo.png" alt="Namoland" width={64} height={64} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg shadow-[#81b29a]/30 mb-3" />
                    <h1 className="text-xl font-bold text-[#3d405b]">Namoland</h1>
                    <p className="text-[#3d405b]/50 text-sm mt-1">{t("title")}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#d1cce7]/20">
                    <AlertMessage message={error} className="text-center" />

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-1">
                                {t("phone")}
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t("phonePlaceholder")}
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none transition-all text-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#3d405b]/70 mb-1">
                                {t("password")}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••"
                                className="w-full px-4 py-3 border border-[#d1cce7]/30 rounded-xl focus:ring-2 focus:ring-[#81b29a]/30 focus:border-[#81b29a] outline-none transition-all text-lg"
                                required
                            />
                            <p className="text-xs text-[#3d405b]/40 mt-1.5">
                                {t("passwordDefault")}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-3 bg-gradient-to-r from-[#3d405b] to-[#609279] text-white rounded-xl font-semibold shadow-lg shadow-[#81b29a]/30 hover:shadow-xl hover:shadow-[#81b29a]/30 transition-all disabled:opacity-50"
                    >
                        {loading ? t("loadingBtn") : t("loginBtn")}
                    </button>
                </form>

                <p className="text-center text-sm text-[#3d405b]/50 mt-4">
                    {t("noAccount")}{" "}
                    <a
                        href={`/user/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                        className="text-[#609279] font-medium hover:text-[#609279]"
                    >
                        {t("registerLink")}
                    </a>
                </p>
            </div>
        </div>
    );
}
