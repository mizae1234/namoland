"use client";

import { useState } from "react";
import { X, Sparkles, Coins } from "lucide-react";
import Image from "next/image";

interface Activity {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    iconImageUrl: string | null;
    coins: number;
    sortOrder: number;
    isActive: boolean;
    showOnLanding: boolean;
}

export default function LandingActivities({ activities }: { activities: Activity[] }) {
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    // Default colors for visual variety if we want to assign them
    const colors = ["#e07a5f", "#81b29a", "#a16b9f", "#f9b61a", "#ecb4ce", "#fab885"];

    const activeActivities = activities
        .filter(a => a.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    if (activeActivities.length === 0) {
        return (
            <div className="text-center py-12 text-[#3d405b]/40">
                ยังไม่มีกิจกรรมเปิดให้บริการในขณะนี้
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeActivities.map((activity, i) => {
                    const color = colors[i % colors.length];
                    return (
                        <div
                            key={activity.id}
                            onClick={() => setSelectedActivity(activity)}
                            className="group relative bg-white rounded-3xl p-6 border border-slate-100 cursor-pointer hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)` }} />
                            
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg text-2xl overflow-hidden relative"
                                style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}33` }}
                            >
                                {activity.iconImageUrl ? (
                                    <Image
                                        src={activity.iconImageUrl}
                                        alt={activity.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    activity.icon || "🌟"
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-[#3d405b] mb-2">{activity.name}</h3>
                            <p className="text-sm text-[#3d405b]/60 leading-relaxed mb-4 line-clamp-2">
                                {activity.description || "คลิกเพื่อดูรายละเอียดเพิ่มเติม"}
                            </p>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: `${color}15`, color: color }}>
                                    <Coins size={12} />
                                    {activity.coins} เหรียญ
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Modal Overlay */}
            {selectedActivity && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setSelectedActivity(null)}
                >
                    <div 
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div 
                                className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg overflow-hidden relative"
                                style={{ 
                                    backgroundColor: colors[activeActivities.indexOf(selectedActivity) % colors.length], 
                                    color: "white" 
                                }}
                            >
                                {selectedActivity.iconImageUrl ? (
                                    <Image
                                        src={selectedActivity.iconImageUrl}
                                        alt={selectedActivity.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    selectedActivity.icon || "🌟"
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="p-2 text-[#3d405b]/40 hover:text-[#3d405b] hover:bg-[#d1cce7]/20 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-[#3d405b] mb-3">
                            {selectedActivity.name}
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-semibold">
                                <Coins size={16} />
                                ใช้ {selectedActivity.coins} เหรียญ
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f1de] text-[#3d405b]/70 rounded-lg text-sm font-medium">
                                <Sparkles size={16} />
                                กิจกรรมสร้างสรรค์
                            </span>
                        </div>

                        <div className="bg-[#f4f1de]/30 rounded-2xl p-5 border border-[#d1cce7]/20">
                            <h4 className="text-sm font-semibold text-[#3d405b] mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#81b29a]" />
                                รายละเอียดกิจกรรม
                            </h4>
                            <p className="text-[#3d405b]/70 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedActivity.description || "ยังไม่มีรายละเอียดสำหรับกิจกรรมนี้"}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#d1cce7]/20 text-center">
                            <button 
                                onClick={() => setSelectedActivity(null)}
                                className="px-8 py-3 bg-[#f4f1de] text-[#3d405b] font-semibold rounded-xl hover:bg-[#d1cce7] transition-colors w-full sm:w-auto"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
