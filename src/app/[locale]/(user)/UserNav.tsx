"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, BookOpen, Coins, User, History, CalendarDays } from "lucide-react";

export default function UserNav() {
    const t = useTranslations("UserNav");
    const pathname = usePathname();

    const navItems = [
        { label: t("home"), href: "/user", icon: Home },
        { label: t("books"), href: "/user/books", icon: BookOpen },
        { label: t("classes"), href: "/user/classes", icon: CalendarDays },
        { label: t("borrows"), href: "/user/borrows", icon: History },
        { label: t("coins"), href: "/user/coins", icon: Coins },
        { label: t("profile"), href: "/user/profile", icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d1cce7]/30 z-50">
            <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const isActive = item.href === "/user"
                        ? pathname === "/user"
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${isActive
                                ? "text-[#a16b9f]"
                                : "text-[#3d405b]/40 hover:text-[#3d405b]/60"
                                }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
