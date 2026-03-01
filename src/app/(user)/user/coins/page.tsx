import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Coins } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default async function UserCoinsPage() {
    const session = await auth();
    const userId = session!.user.id;

    const packages = await prisma.coinPackage.findMany({
        where: { userId },
        include: {
            transactions: { orderBy: { createdAt: "desc" }, take: 10 },
        },
        orderBy: { createdAt: "desc" },
    });

    const activePackages = packages.filter((p) => !p.isExpired && p.remainingCoins > 0);
    const totalCoins = activePackages.reduce((s, p) => s + p.remainingCoins, 0);

    return (
        <div className="p-4">
            {/* Total Coins */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                    <Coins size={20} />
                    <span className="text-amber-100 text-sm">เหรียญคงเหลือทั้งหมด</span>
                </div>
                <p className="text-4xl font-bold">{totalCoins}</p>
            </div>

            {/* Active Packages */}
            <h2 className="font-semibold text-slate-800 mb-3">แพ็คเกจเหรียญ</h2>
            <div className="space-y-3 mb-6">
                {activePackages.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 border border-slate-100 text-center text-slate-400 text-sm">
                        ยังไม่มีแพ็คเกจเหรียญ
                    </div>
                ) : (
                    activePackages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">
                                    แพ็คเกจ {pkg.totalCoins} เหรียญ
                                </span>
                                <span className="text-lg font-bold text-amber-500">
                                    {pkg.remainingCoins} <span className="text-xs font-normal text-slate-400">เหลือ</span>
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                <div
                                    className="bg-amber-400 h-1.5 rounded-full"
                                    style={{ width: `${(pkg.remainingCoins / pkg.totalCoins) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>ใช้ไป {pkg.totalCoins - pkg.remainingCoins}</span>
                                {pkg.expiresAt && (
                                    <span className={new Date(pkg.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "text-red-500 font-medium" : ""}>
                                        หมดอายุ {format(new Date(pkg.expiresAt), "d MMM yy", { locale: th })}
                                    </span>
                                )}
                                {!pkg.firstUsedAt && <span className="text-emerald-500">ยังไม่เริ่มใช้</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Recent Transactions */}
            <h2 className="font-semibold text-slate-800 mb-3">ธุรกรรมล่าสุด</h2>
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                {packages.flatMap((p) => p.transactions).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((tx) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                {tx.className || tx.description || tx.type}
                            </p>
                            <p className="text-xs text-slate-400">
                                {format(new Date(tx.createdAt), "d MMM yy", { locale: th })}
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-red-500">-{tx.coinsUsed}</span>
                    </div>
                ))}
                {packages.flatMap((p) => p.transactions).length === 0 && (
                    <div className="px-4 py-6 text-center text-slate-400 text-sm">ยังไม่มีธุรกรรม</div>
                )}
            </div>
        </div>
    );
}
