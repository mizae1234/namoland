"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Package, CalendarDays, Calendar, UserCog, ImageIcon, GraduationCap, Sparkles } from "lucide-react";

import ShopInfoForm from "./ShopInfoForm";
import PackageManager from "../../coins/packages/_components/PackageManager";
import ActivityManager from "../../activities/_components/ActivityManager";
import TeacherManager from "./TeacherManager";
import ScheduleList from "../../classes/_components/ScheduleList";
import AdminUsersManager from "./AdminUsersManager";
import ScheduleImageUploader from "./ScheduleImageUploader";
import { useTranslations } from "next-intl";

interface TabConfig {
    key: string;
    labelKey: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabConfig[] = [
    { key: "shop", labelKey: "shop", icon: Store },
    { key: "packages", labelKey: "packages", icon: Package },
    { key: "activities", labelKey: "activities", icon: CalendarDays },
    { key: "teachers", labelKey: "teachers", icon: GraduationCap },
    { key: "classes", labelKey: "classes", icon: Calendar },
    { key: "schedule", labelKey: "schedule", icon: ImageIcon },
    { key: "landing", labelKey: "landing", icon: Sparkles },
    { key: "users", labelKey: "users", icon: UserCog },
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
        weeklyScheduleImageUrl: string | null;
        heroImageUrl: string | null;
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
        description: string | null;
        icon: string | null;
        iconImageUrl: string | null;
        coins: number;
        sortOrder: number;
        isActive: boolean;
        showOnLanding: boolean;
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
    teachers: {
        id: string;
        name: string;
        nickname: string | null;
        color: string | null;
        isActive: boolean;
        sortOrder: number;
    }[];
    currentUserId: string;
    userRole: string;
}

export default function SettingsTabs({
    shopInfo,
    packages,
    activities,
    schedules,
    adminUsers,
    teachers,
    currentUserId,
    userRole,
}: SettingsTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const t = useTranslations("AdminSettings");

    const visibleTabs = userRole === "SUPER_ADMIN" ? TABS : TABS.filter(tab => tab.key !== "users");

    const [activeTab, setActiveTab] = useState(
        visibleTabs.some((t) => t.key === tabParam) ? tabParam! : "shop"
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
                {visibleTabs.map((tab) => {
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
                            {t(`tabs.${tab.labelKey}`)}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "shop" && <ShopInfoForm shopInfo={shopInfo} />}
                {activeTab === "packages" && <PackageManager packages={packages} />}
                {activeTab === "activities" && <ActivityManager activities={activities} />}
                {activeTab === "teachers" && <TeacherManager teachers={teachers} />}
                {activeTab === "classes" && <ScheduleList schedules={schedules} mode="manage" />}
                {activeTab === "schedule" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ScheduleImageUploader
                            currentImageUrl={shopInfo.scheduleImageUrl}
                            type="monthly"
                            title={t("scheduleTab.monthlyTitle")}
                            description={t("scheduleTab.monthlyDesc")}
                        />
                        <ScheduleImageUploader
                            currentImageUrl={shopInfo.weeklyScheduleImageUrl}
                            type="weekly"
                            title={t("scheduleTab.weeklyTitle")}
                            description={t("scheduleTab.weeklyDesc")}
                        />
                    </div>
                )}
                {activeTab === "landing" && (
                    <div className="max-w-xl">
                        <ScheduleImageUploader
                            currentImageUrl={shopInfo.heroImageUrl}
                            type="heroImage"
                            title={t("landingTab.heroTitle")}
                            description={t("landingTab.heroDesc")}
                        />
                    </div>
                )}
                {activeTab === "users" && (
                    <AdminUsersManager users={adminUsers} currentUserId={currentUserId} />
                )}
            </div>
        </div>
    );
}
