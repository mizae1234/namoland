"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Package, CalendarDays, Calendar, UserCog, ImageIcon } from "lucide-react";

import ShopInfoForm from "./ShopInfoForm";
import PackageManager from "../../coins/packages/_components/PackageManager";
import ActivityManager from "../../activities/_components/ActivityManager";
import ScheduleList from "../../classes/_components/ScheduleList";
import AdminUsersManager from "./AdminUsersManager";
import ScheduleImageUploader from "./ScheduleImageUploader";

interface TabConfig {
    key: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabConfig[] = [
    { key: "shop", label: "ข้อมูลร้าน", icon: Store },
    { key: "packages", label: "แพ็คเกจเหรียญ", icon: Package },
    { key: "activities", label: "กิจกรรม", icon: CalendarDays },
    { key: "classes", label: "ตารางคลาส", icon: Calendar },
    { key: "schedule", label: "ตารางกิจกรรม", icon: ImageIcon },
    { key: "users", label: "จัดการผู้ใช้", icon: UserCog },
];

interface SettingsTabsProps {
    shopInfo: {
        id: string;
        shopName: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        note: string | null;
        scheduleImageUrl: string | null;
    };
    packages: {
        id: string;
        key: string;
        label: string;
        coins: number;
        price: number;
        bonus: number;
        sortOrder: number;
        isActive: boolean;
    }[];
    activities: {
        id: string;
        name: string;
        coins: number;
        sortOrder: number;
        isActive: boolean;
    }[];
    schedules: {
        id: string;
        theme: string | null;
        startDate: string;
        endDate: string;
        entries: {
            id: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            title: string;
        }[];
        _count: { entries: number };
    }[];
    adminUsers: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
    }[];
    currentUserId: string;
}

export default function SettingsTabs({
    shopInfo,
    packages,
    activities,
    schedules,
    adminUsers,
    currentUserId,
}: SettingsTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(
        TABS.some((t) => t.key === tabParam) ? tabParam! : "shop"
    );

    // Sync URL when tab changes
    useEffect(() => {
        const current = searchParams.get("tab") || "shop";
        if (current !== activeTab) {
            const params = new URLSearchParams(searchParams.toString());
            if (activeTab === "shop") {
                params.delete("tab");
            } else {
                params.set("tab", activeTab);
            }
            const qs = params.toString();
            router.replace(`/settings${qs ? `?${qs}` : ""}`, { scroll: false });
        }
    }, [activeTab, searchParams, router]);

    return (
        <div>
            {/* Tab Bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-[#d1cce7]/20 -mx-1 px-1">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 -mb-[1px]
                                ${isActive
                                    ? "border-[#609279] text-[#609279] bg-[#81b29a]/5"
                                    : "border-transparent text-[#3d405b]/40 hover:text-[#3d405b]/70 hover:bg-[#f4f1de]/50"
                                }`}
                        >
                            <Icon
                                size={16}
                                className={isActive ? "text-[#609279]" : "text-[#3d405b]/30"}
                            />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "shop" && <ShopInfoForm shopInfo={shopInfo} />}
                {activeTab === "packages" && <PackageManager packages={packages} />}
                {activeTab === "activities" && <ActivityManager activities={activities} />}
                {activeTab === "classes" && <ScheduleList schedules={schedules} mode="manage" />}
                {activeTab === "schedule" && (
                    <ScheduleImageUploader currentImageUrl={shopInfo.scheduleImageUrl} />
                )}
                {activeTab === "users" && (
                    <AdminUsersManager users={adminUsers} currentUserId={currentUserId} />
                )}
            </div>
        </div>
    );
}
