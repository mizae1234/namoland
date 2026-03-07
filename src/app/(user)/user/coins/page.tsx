import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Coins, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { getUserTopUpRequests } from "@/actions/coin";

const TOPUP_STATUS_MAP: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    PENDING: { label: "รอดำเนินการ", icon: Clock, className: "text-amber-500 bg-amber-50" },
    APPROVED: { label: "อนุมัติแล้ว", icon: CheckCircle, className: "text-emerald-500 bg-emerald-50" },
    REJECTED: { label: "ปฏิเสธ", icon: XCircle, className: "text-red-500 bg-red-50" },
};

export default async function UserCoinsPage() {
    const session = await auth();
    const userId = session!.user.id;

    const [packages, topUpRequests, userRecord] = await Promise.all([
        prisma.coinPackage.findMany({
            where: { userId },
            include: {
                transactions: { orderBy: { createdAt: "desc" }, take: 10 },
            },
            orderBy: { createdAt: "desc" },
        }),
        getUserTopUpRequests(),
        prisma.user.findUnique({ where: { id: userId }, select: { coinExpiryOverride: true } }),
    ]);

    const activePackages = packages.filter((p) => !p.isExpired && p.remainingCoins > 0);
    const totalCoins = activePackages.reduce((s, p) => s + p.remainingCoins, 0);
    const pendingRequests = topUpRequests.filter((r) => r.status === "PENDING");
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Effective expiry — auto-maintained by actions
    const latestExpiry = userRecord?.coinExpiryOverride ? new Date(userRecord.coinExpiryOverride) : null;
    const daysLeft = latestExpiry
        ? Math.ceil((latestExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="p-4">
            {/* Total Coins */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 text-white mb-4 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                    <Coins size={20} />
                    <span className="text-amber-100 text-sm">เหรียญคงเหลือทั้งหมด</span>
                </div>
                <p className="text-4xl font-bold">{totalCoins}</p>
                {latestExpiry && totalCoins > 0 && (
                    <p className={`text-xs mt-2 ${daysLeft !== null && daysLeft <= 7 ? "text-white font-semibold" : "text-white/60"}`}>
                        หมดอายุ {format(latestExpiry, "d MMM yyyy", { locale: th })}
                        {daysLeft !== null && daysLeft <= 7 && (
                            <span> ({daysLeft <= 0 ? "หมดแล้ว!" : `อีก ${daysLeft} วัน`})</span>
                        )}
                    </p>
                )}
            </div>

            {/* Top Up Button */}
            <Link
                href="/user/coins/top-up"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 mb-6"
            >
                <Plus size={18} />
                เติมเหรียญ
            </Link>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-semibold text-[#3d405b] mb-3">รอดำเนินการ</h2>
                    <div className="space-y-2">
                        {pendingRequests.map((req) => {
                            const status = TOPUP_STATUS_MAP[req.status];
                            const StatusIcon = status.icon;
                            return (
                                <div key={req.id} className={`rounded-xl p-4 border ${status.className}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <StatusIcon size={16} />
                                            <span className="text-sm font-medium">{req.coins} เหรียญ · ฿{Number(req.amount).toLocaleString()}</span>
                                        </div>
                                        <span className="text-xs">{status.label}</span>
                                    </div>
                                    <p className="text-xs mt-1 opacity-70">
                                        {format(new Date(req.createdAt), "d MMM yy HH:mm", { locale: th })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Packages */}
            <h2 className="font-semibold text-[#3d405b] mb-3">แพ็คเกจเหรียญ</h2>
            <div className="space-y-3 mb-6">
                {activePackages.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 border border-[#d1cce7]/20 text-center text-[#3d405b]/40 text-sm">
                        ยังไม่มีแพ็คเกจเหรียญ
                    </div>
                ) : (
                    activePackages.map((pkg) => (
                        <div key={pkg.id} className="bg-white rounded-xl p-4 border border-[#d1cce7]/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[#3d405b]/80">
                                    แพ็คเกจ {pkg.totalCoins} เหรียญ
                                </span>
                                <span className="text-lg font-bold text-amber-500">
                                    {pkg.remainingCoins} <span className="text-xs font-normal text-[#3d405b]/40">เหลือ</span>
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-[#d1cce7]/15 rounded-full h-1.5 mb-2">
                                <div
                                    className="bg-amber-400 h-1.5 rounded-full"
                                    style={{ width: `${(pkg.remainingCoins / pkg.totalCoins) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-[#3d405b]/40">
                                <span>ใช้ไป {pkg.totalCoins - pkg.remainingCoins}</span>
                                {pkg.expiresAt && (
                                    <span className={new Date(pkg.expiresAt) < sevenDaysFromNow ? "text-red-500 font-medium" : ""}>
                                        หมดอายุ {format(new Date(pkg.expiresAt), "d MMM yy", { locale: th })}
                                    </span>
                                )}
                                {!pkg.firstUsedAt && <span className="text-emerald-500">ยังไม่เริ่มใช้</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Recent Top-Up History */}
            {topUpRequests.length > 0 && (
                <>
                    <h2 className="font-semibold text-[#3d405b] mb-3">ประวัติเติมเหรียญ</h2>
                    <div className="bg-white rounded-xl border border-[#d1cce7]/20 divide-y divide-[#d1cce7]/15 mb-6">
                        {topUpRequests.filter((r) => r.status !== "PENDING").map((req) => {
                            const status = TOPUP_STATUS_MAP[req.status];
                            const StatusIcon = status.icon;
                            return (
                                <div key={req.id} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon size={14} className={status.className.split(" ")[0]} />
                                        <div>
                                            <p className="text-sm text-[#3d405b]/80">{req.coins} เหรียญ · ฿{Number(req.amount).toLocaleString()}</p>
                                            <p className="text-xs text-[#3d405b]/40">{format(new Date(req.createdAt), "d MMM yy", { locale: th })}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Recent Transactions */}
            <h2 className="font-semibold text-[#3d405b] mb-3">ธุรกรรมล่าสุด</h2>
            <div className="bg-white rounded-xl border border-[#d1cce7]/20 divide-y divide-[#d1cce7]/15">
                {packages.flatMap((p) => p.transactions).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((tx) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3d405b]/80">
                                {tx.className || tx.description || tx.type}
                            </p>
                            <p className="text-xs text-[#3d405b]/40">
                                {format(new Date(tx.createdAt), "d MMM yy", { locale: th })}
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-red-500">-{tx.coinsUsed}</span>
                    </div>
                ))}
                {packages.flatMap((p) => p.transactions).length === 0 && (
                    <div className="px-4 py-6 text-center text-[#3d405b]/40 text-sm">ยังไม่มีธุรกรรม</div>
                )}
            </div>
        </div>
    );
}
