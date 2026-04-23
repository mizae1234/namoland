"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    Users,
    Coins,
    BookOpen,
    ArrowLeftRight,
    BarChart3,
    Settings,
    LogOut,
    QrCode,
    Crown,
    Menu,
    X,
    Calendar,
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

type MenuRole = "ADMIN" | "SUPER_ADMIN";

interface MenuItem {
    key: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    roles: MenuRole[];
}

const menuItems: MenuItem[] = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "owner", href: "/owner", icon: Crown, roles: ["SUPER_ADMIN"] },
    { key: "members", href: "/members", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "coins", href: "/coins", icon: Coins, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "books", href: "/books", icon: BookOpen, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "borrows", href: "/borrows", icon: ArrowLeftRight, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "scan", href: "/borrows/scan", icon: QrCode, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "classes", href: "/classes", icon: Calendar, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "SUPER_ADMIN"] },
    { key: "settings", href: "/settings", icon: Settings, roles: ["ADMIN", "SUPER_ADMIN"] },
];

export default function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
    const t = useTranslations("AdminSidebar");
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const visibleMenuItems = menuItems.filter(
        (item) => item.roles.includes(userRole as MenuRole)
    );

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-[#d1cce7]/20">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Image src="/namoland-logo.png" alt="NAMOLAND" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                            <h1 className="font-bold text-[#3d405b]">{t("appTitle")}</h1>
                            <p className="text-xs text-[#3d405b]/40">{t("appSubtitle")}</p>
                        </div>
                    </Link>
                    {/* Close button on mobile */}
                    <button
                        onClick={() => setOpen(false)}
                        className="ml-auto md:hidden p-1.5 text-[#3d405b]/40 hover:text-[#3d405b] rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                <div className="mb-4 px-3">
                    <LanguageSwitcher />
                </div>
                {visibleMenuItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(`${item.href}/`) &&
                            !visibleMenuItems.some(
                                (other) => other.href !== item.href && other.href.startsWith(`${item.href}/`) && (pathname === other.href || pathname.startsWith(`${other.href}/`))
                            ));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-[#81b29a]/10 text-[#609279] shadow-sm"
                                    : "text-[#3d405b]/50 hover:bg-[#f4f1de] hover:text-[#3d405b]"
                                }`}
                        >
                            <Icon
                                size={20}
                                className={isActive ? "text-[#609279]" : "text-[#3d405b]/30"}
                            />
                            {t(`menu.${item.key}`)}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-[#d1cce7]/20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-[#81b29a]/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#609279] font-semibold text-sm">
                            {userName?.[0]?.toUpperCase() || "A"}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#3d405b] truncate">
                            {userName}
                        </p>
                        <p className="text-xs text-[#3d405b]/40">
                            {userRole === "SUPER_ADMIN" ? t("role.superAdmin") : t("role.admin")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 text-sm text-[#3d405b]/40 hover:text-red-500 active:text-red-500 transition-colors w-full px-2 py-2.5 rounded-lg hover:bg-red-50 active:bg-red-50"
                >
                    <LogOut size={16} />
                    {t("logout")}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-xl shadow-md border border-[#d1cce7]/30"
            >
                <Menu size={22} className="text-[#3d405b]" />
            </button>

            {/* Desktop sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-[#d1cce7]/30 flex-col z-40">
                {sidebarContent}
            </aside>

            {/* Mobile overlay sidebar */}
            {open && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 h-full w-72 bg-white flex flex-col z-50 md:hidden shadow-2xl">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}
