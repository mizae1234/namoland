"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
} from "lucide-react";

const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "ภาพรวมธุรกิจ", href: "/owner", icon: Crown },
    { label: "สมาชิก", href: "/members", icon: Users },
    { label: "เหรียญ", href: "/coins", icon: Coins },
    { label: "หนังสือ", href: "/books", icon: BookOpen },
    { label: "ยืม-คืน", href: "/borrows", icon: ArrowLeftRight },
    { label: "สแกน QR", href: "/borrows/scan", icon: QrCode },
    { label: "รายงาน", href: "/reports", icon: BarChart3 },
    { label: "ตั้งค่า", href: "/settings", icon: Settings },
];

export default function Sidebar({ userName }: { userName: string }) {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                        <span className="text-white font-bold text-lg">N</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800">Namoland</h1>
                        <p className="text-xs text-slate-400">ระบบจัดการ</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(`${item.href}/`) &&
                            !menuItems.some(
                                (other) => other.href !== item.href && other.href.startsWith(`${item.href}/`) && (pathname === other.href || pathname.startsWith(`${other.href}/`))
                            ));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                        >
                            <Icon
                                size={20}
                                className={isActive ? "text-blue-500" : "text-slate-400"}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                            {userName?.[0]?.toUpperCase() || "A"}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                            {userName}
                        </p>
                        <p className="text-xs text-slate-400">ผู้ดูแลระบบ</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                    <LogOut size={16} />
                    ออกจากระบบ
                </button>
            </div>
        </aside>
    );
}
