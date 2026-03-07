import { getExpiringPackages, getAllTopUps } from "@/actions/coin";
import { Coins, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import ExpiryActions from "./_components/ExpiryActions";
import Card from "@/components/ui/Card";
import TopUpActions from "./top-ups/_components/TopUpActions";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    PENDING: { label: "รอดำเนินการ", className: "bg-amber-100 text-amber-700" },
    APPROVED: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700" },
    REJECTED: { label: "ปฏิเสธ", className: "bg-red-100 text-red-700" },
};

export default async function CoinsPage() {
    const [expiring, topUps] = await Promise.all([
        getExpiringPackages(),
        getAllTopUps(),
    ]);

    const pending = topUps.filter(t => t.status === "PENDING");
    const others = topUps.filter(t => t.status !== "PENDING");

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">จัดการเหรียญ</h1>
                <p className="text-[#3d405b]/50 mt-1">คำขอเติมเหรียญ และเหรียญใกล้หมดอายุ</p>
            </div>

            {/* Pending Top-Up Requests */}
            <Card padding={false} className="mb-6">
                <div className="p-6 border-b border-[#d1cce7]/20 flex items-center justify-between">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        คำขอเติมเหรียญ
                        {pending.length > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                {pending.length} รายการรอ
                            </span>
                        )}
                    </h2>
                </div>
                <div className="divide-y divide-[#d1cce7]/15">
                    {pending.length === 0 ? (
                        <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                            ไม่มีคำขอเติมเหรียญที่รอดำเนินการ
                        </div>
                    ) : (
                        pending.map((req) => (
                            <div key={req.id} className="px-6 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-[#3d405b]/80 text-sm">{req.user.parentName}</p>
                                        <div className="flex items-center gap-3 text-xs text-[#3d405b]/40 mt-0.5">
                                            <span className="font-semibold text-amber-600">{req.coins} เหรียญ</span>
                                            <span>฿{Number(req.amount).toLocaleString()}</span>
                                            <span>{format(new Date(req.createdAt), "d MMM yy HH:mm", { locale: th })}</span>
                                        </div>
                                        {req.slipNote && (
                                            <p className="text-xs text-[#3d405b]/40 mt-0.5">💬 {req.slipNote}</p>
                                        )}
                                    </div>
                                    <TopUpActions requestId={req.id} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Past Top-Ups */}
            {others.length > 0 && (
                <Card padding={false} className="mb-6">
                    <details>
                        <summary className="p-6 cursor-pointer hover:bg-[#f4f1de]/30 transition-colors">
                            <span className="font-semibold text-[#3d405b] text-sm">
                                ประวัติคำขอเติมเหรียญ ({others.length} รายการ)
                            </span>
                        </summary>
                        <div className="divide-y divide-[#d1cce7]/15 border-t border-[#d1cce7]/20">
                            {others.map((req) => {
                                const status = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
                                return (
                                    <div key={req.id} className="px-6 py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-[#3d405b]/70">{req.user.parentName}</p>
                                                <div className="flex items-center gap-3 text-xs text-[#3d405b]/40 mt-0.5">
                                                    <span>{req.coins} เหรียญ</span>
                                                    <span>฿{Number(req.amount).toLocaleString()}</span>
                                                    <span>{format(new Date(req.createdAt), "d MMM yy HH:mm", { locale: th })}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        {req.adminNote && (
                                            <p className="text-xs text-[#3d405b]/40 mt-1">📝 {req.adminNote}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                </Card>
            )}

            {/* Alert Banner */}
            {expiring.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">
                            มี {expiring.length} แพ็คเกจใกล้หมดอายุภายใน 7 วัน
                        </p>
                        <p className="text-sm text-amber-600">กรุณาตรวจสอบและดำเนินการ</p>
                    </div>
                </div>
            )}

            {/* Expiring Packages */}
            <Card padding={false}>
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        เหรียญใกล้หมดอายุ
                    </h2>
                </div>
                <div className="divide-y divide-[#d1cce7]/15">
                    {expiring.length === 0 ? (
                        <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                            ไม่มีเหรียญใกล้หมดอายุ
                        </div>
                    ) : (
                        expiring.map((pkg) => (
                            <div key={pkg.id} className="px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-[#3d405b]/80">{pkg.user.parentName}</p>
                                        <p className="text-sm text-[#3d405b]/50">{pkg.user.phone}</p>
                                        <p className="text-xs text-[#3d405b]/40 mt-1">
                                            คงเหลือ: <span className="font-semibold text-amber-600">{pkg.remainingCoins} เหรียญ</span>
                                            {" · "}หมดอายุ:{" "}
                                            {pkg.expiresAt && (
                                                <span className="text-red-500 font-medium">
                                                    {format(new Date(pkg.expiresAt), "d MMM yyyy", { locale: th })}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <ExpiryActions
                                        packageId={pkg.id}
                                        userId={pkg.userId}
                                        remainingCoins={pkg.remainingCoins}
                                        currentExpiry={pkg.expiresAt ? pkg.expiresAt.toISOString() : null}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}

