"use client";

import { useState } from "react";

type Props = {
    data: { date: string; revenue: number }[];
};

export default function RevenueChart({ data }: Props) {
    const [range, setRange] = useState<7 | 30>(7);
    const chartData = range === 7 ? data.slice(-7) : data;
    const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
    const chartHeight = 200;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800 text-lg">
                    📈 Revenue Trend
                </h2>
                <div className="flex bg-slate-100 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setRange(7)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === 7
                            ? "bg-blue-500 text-white"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        7 วัน
                    </button>
                    <button
                        onClick={() => setRange(30)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === 30
                            ? "bg-blue-500 text-white"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        30 วัน
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: chartHeight + 40 }}>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 pr-2" style={{ height: chartHeight }}>
                    <span>{maxRevenue.toLocaleString()}</span>
                    <span>{Math.round(maxRevenue / 2).toLocaleString()}</span>
                    <span>0</span>
                </div>

                {/* Bars */}
                <div className="ml-12 flex items-end gap-[2px]" style={{ height: chartHeight }}>
                    {chartData.map((d, i) => {
                        const h = maxRevenue > 0 ? (d.revenue / maxRevenue) * chartHeight : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-10 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    ฿{d.revenue.toLocaleString()}
                                </div>

                                <div
                                    className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                                    style={{
                                        height: Math.max(h, 2),
                                        background: d.revenue > 0
                                            ? "linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%)"
                                            : "#E2E8F0",
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
                                <span className="text-[10px] text-slate-400">
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
