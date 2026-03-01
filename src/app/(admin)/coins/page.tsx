import { getExpiringPackages, confirmExpiry, extendExpiry } from "@/actions/coin";
import { Coins, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import ExpiryActions from "./_components/ExpiryActions";
import Card from "@/components/ui/Card";

export default async function CoinsPage() {
    const expiring = await getExpiringPackages();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">จัดการเหรียญ</h1>
                <p className="text-slate-500 mt-1">เหรียญใกล้หมดอายุ และระบบขยายเวลา</p>
            </div>

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
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        เหรียญใกล้หมดอายุ
                    </h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {expiring.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">
                            ไม่มีเหรียญใกล้หมดอายุ
                        </div>
                    ) : (
                        expiring.map((pkg) => (
                            <div key={pkg.id} className="px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-medium text-slate-700">{pkg.user.parentName}</p>
                                        <p className="text-sm text-slate-500">{pkg.user.phone}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            คงเหลือ: <span className="font-semibold text-amber-600">{pkg.remainingCoins} เหรียญ</span>
                                            {" · "}หมดอายุ:{" "}
                                            {pkg.expiresAt && (
                                                <span className="text-red-500 font-medium">
                                                    {format(new Date(pkg.expiresAt), "d MMM yyyy", { locale: th })}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <ExpiryActions packageId={pkg.id} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
