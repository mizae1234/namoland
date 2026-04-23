"use client";

import { useState } from "react";
import { OutstandingCoinReport } from "@/actions/report";
import { ClassAttendanceReport as AttendanceReportData } from "@/actions/report";
import { Coins, CalendarDays, User, DollarSign } from "lucide-react";
import OutstandingCoinTable from "./OutstandingCoinTable";
import ClassAttendanceReport from "./ClassAttendanceReport";
import MemberCoinReport from "./MemberCoinReport";
import FinancialReport from "./FinancialReport";
import { useTranslations } from "next-intl";

type Tab = "coin" | "attendance" | "member" | "financial";

type TabDef = {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    superAdminOnly: boolean;
};

export default function ReportTabs({
    coinData,
    attendanceData,
    userRole,
}: {
    coinData: OutstandingCoinReport;
    attendanceData: AttendanceReportData;
    userRole: string;
}) {
    const t = useTranslations("AdminReports");

    const allTabs: TabDef[] = [
        { key: "coin", label: t("tabs.coin"), icon: <Coins size={16} />, superAdminOnly: true },
        { key: "attendance", label: t("tabs.attendance"), icon: <CalendarDays size={16} />, superAdminOnly: false },
        { key: "member", label: t("tabs.member"), icon: <User size={16} />, superAdminOnly: false },
        { key: "financial", label: t("tabs.financial"), icon: <DollarSign size={16} />, superAdminOnly: true },
    ];

    const visibleTabs = userRole === "SUPER_ADMIN"
        ? allTabs
        : allTabs.filter(tab => !tab.superAdminOnly);

    const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0]?.key || "attendance");

    return (
        <div>
            {/* Tab Header */}
            <div className="flex items-center gap-1 mb-6 border-b border-[#d1cce7]/30">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                            activeTab === tab.key
                                ? "text-[#609279] border-[#609279]"
                                : "text-[#3d405b]/40 border-transparent hover:text-[#3d405b]/70"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "coin" && (
                <div>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#3d405b] flex items-center gap-3">
                            <Coins size={24} className="text-amber-500" />
                            {t("tabs.coin")}
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            {t("descriptions.coin")}
                        </p>
                    </div>
                    <OutstandingCoinTable initialData={coinData} />
                </div>
            )}

            {activeTab === "attendance" && (
                <div>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#3d405b] flex items-center gap-3">
                            <CalendarDays size={24} className="text-[#609279]" />
                            {t("tabs.attendance")}
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            {t("descriptions.attendance")}
                        </p>
                    </div>
                    <ClassAttendanceReport initialData={attendanceData} />
                </div>
            )}

            {activeTab === "member" && (
                <div>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#3d405b] flex items-center gap-3">
                            <User size={24} className="text-violet-500" />
                            {t("tabs.member")}
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            {t("descriptions.member")}
                        </p>
                    </div>
                    <MemberCoinReport />
                </div>
            )}

            {activeTab === "financial" && (
                <div>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#3d405b] flex items-center gap-3">
                            <DollarSign size={24} className="text-emerald-500" />
                            {t("tabs.financial")}
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            {t("descriptions.financial")}
                        </p>
                    </div>
                    <FinancialReport />
                </div>
            )}
        </div>
    );
}
