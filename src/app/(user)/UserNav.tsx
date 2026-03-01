"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Coins, User } from "lucide-react";

const navItems = [
    { label: "หน้าหลัก", href: "/user", icon: Home },
    { label: "หนังสือ", href: "/user/books", icon: BookOpen },
    { label: "เหรียญ", href: "/user/coins", icon: Coins },
    { label: "โปรไฟล์", href: "/user/profile", icon: User },
];

export default function UserNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
            <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${isActive
                                    ? "text-blue-500"
                                    : "text-slate-400 hover:text-slate-600"
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
