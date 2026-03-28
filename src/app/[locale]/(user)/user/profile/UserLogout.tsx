"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export default function UserLogout() {
    const t = useTranslations("UserProfile");
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/user/login" })}
            className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
            <LogOut size={18} />
            {t("logout")}
        </button>
    );
}
