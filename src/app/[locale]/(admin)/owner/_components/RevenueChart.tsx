"use client";

import { useState } from "react";

type Props = {
    data: { date: string; revenue: number; cash: number }[];
};

type ChartMode = "revenue" | "cash";

export default function RevenueChart({ data }: Props) {
    const [range, setRange] = useState<7 | 30>(7);
    const [mode, setMode] = useState<ChartMode>("revenue");

    const chartData = range === 7 ? data.slice(-7) : data;
    const values = chartData.map((d) => (mode === "revenue" ? d.revenue : d.cash));
    const maxValue = Math.max(...values, 1);
    const chartHeight = 200;

    const modeConfig = {
        revenue: {
            label: "📈 Revenue Trend",
            gradient: "linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)",
            emptyColor: "#E2E8F0",
            tooltipPrefix: "฿",
        },
        cash: {
            label: "💰 Cash Trend",
            gradient: "linear-gradient(180deg, #10B981 0%, #34D399 100%)",
            emptyColor: "#E2E8F0",
            tooltipPrefix: "฿",
        },
    };

    const config = modeConfig[mode];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="flex bg-[#d1cce7]/15 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setMode("revenue")}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "revenue"
                                ? "bg-blue-500 text-white"
                                : "text-[#3d405b]/50 hover:text-[#3d405b]/80"
                                }`}
                        >
                            รายได้
                        </button>
                        <button
                            onClick={() => setMode("cash")}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "cash"
                                ? "bg-emerald-500 text-white"
                                : "text-[#3d405b]/50 hover:text-[#3d405b]/80"
                                }`}
                        >
                            เงินรับ
                        </button>
                    </div>
                    <h2 className="font-semibold text-[#3d405b] text-lg">
                        {config.label}
                    </h2>
                </div>

                {/* Range Toggle */}
                <div className="flex bg-[#d1cce7]/15 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setRange(7)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === 7
                            ? "bg-[#609279] text-white"
                            : "text-[#3d405b]/50 hover:text-[#3d405b]/80"
                            }`}
                    >
                        7 วัน
                    </button>
                    <button
                        onClick={() => setRange(30)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === 30
                            ? "bg-[#609279] text-white"
                            : "text-[#3d405b]/50 hover:text-[#3d405b]/80"
                            }`}
                    >
                        30 วัน
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: chartHeight + 40 }}>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-[#3d405b]/40 pr-2" style={{ height: chartHeight }}>
                    <span>{maxValue.toLocaleString()}</span>
                    <span>{Math.round(maxValue / 2).toLocaleString()}</span>
                    <span>0</span>
                </div>

                {/* Bars */}
                <div className="ml-12 flex items-end gap-[2px]" style={{ height: chartHeight }}>
                    {chartData.map((d, i) => {
                        const val = mode === "revenue" ? d.revenue : d.cash;
                        const h = maxValue > 0 ? (val / maxValue) * chartHeight : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-10 bg-[#3d405b] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {config.tooltipPrefix}{val.toLocaleString()}
                                </div>

                                <div
                                    className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                                    style={{
                                        height: Math.max(h, 2),
                                        background: val > 0
                                            ? config.gradient
                                            : config.emptyColor,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* X-axis labels */}
                <div className="ml-12 flex gap-[2px] mt-2">
                    {chartData.map((d, i) => {
                        // Show every label for 7 days, every 5th for 30 days
                        const show = range === 7 || i % 5 === 0 || i === chartData.length - 1;
                        return (
                            <div key={i} className="flex-1 text-center">
                                <span className="text-[10px] text-[#3d405b]/40">
                                    {show ? d.date : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
