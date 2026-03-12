"use client";

import { useState } from "react";
import { OutstandingCoinReport } from "@/actions/report";
import { ClassAttendanceReport as AttendanceReportData } from "@/actions/report";
import { Coins, CalendarDays } from "lucide-react";
import OutstandingCoinTable from "./OutstandingCoinTable";
import ClassAttendanceReport from "./ClassAttendanceReport";

type Tab = "coin" | "attendance";

export default function ReportTabs({
    coinData,
    attendanceData,
}: {
    coinData: OutstandingCoinReport;
    attendanceData: AttendanceReportData;
}) {
    const [activeTab, setActiveTab] = useState<Tab>("coin");

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "coin", label: "Outstanding Coin", icon: <Coins size={16} /> },
        { key: "attendance", label: "สรุปเข้าคลาส", icon: <CalendarDays size={16} /> },
    ];

    return (
        <div>
            {/* Tab Header */}
            <div className="flex items-center gap-1 mb-6 border-b border-[#d1cce7]/30">
                {tabs.map((tab) => (
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
                            Outstanding Coin
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            สรุปยอดเหรียญคงเหลือในระบบ แยกตามเดือน
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
                            สรุปการเข้าคลาส
                        </h1>
                        <p className="text-[#3d405b]/50 mt-1">
                            รายงานการจองและเข้าเรียนคลาส พร้อมรายละเอียด
                        </p>
                    </div>
                    <ClassAttendanceReport initialData={attendanceData} />
                </div>
            )}
        </div>
    );
}
