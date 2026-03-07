import { getMemberById } from "@/actions/member";
import { getActivePackages } from "@/actions/packageConfig";
import { notFound } from "next/navigation";
import Link from "next/link";
import { User, Coins, BookOpen, History } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import MemberActions from "./_components/MemberActions";
import MemberEditForm from "./_components/MemberEditForm";
import MemberCoinHistory from "./_components/MemberCoinHistory";
import ConfirmReserveButton from "../../borrows/_components/ConfirmReserveButton";
import BackLink from "@/components/ui/BackLink";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [member, dbPackages] = await Promise.all([
        getMemberById(id),
        getActivePackages(),
    ]);

    if (!member) notFound();

    const packageOptions = dbPackages.map(p => ({
        type: p.key,
        label: p.label,
        price: p.price.toLocaleString(),
        coins: p.coins,
        bonus: p.bonus > 0 ? `ประหยัด ${p.bonus.toLocaleString()}` : "-",
    }));

    const activePackages = member.coinPackages
        .filter((p) => !p.isExpired && p.remainingCoins > 0);

    const totalCoins = activePackages
        .reduce((s, p) => s + p.remainingCoins, 0);

    // Effective expiry — auto-maintained by spendCoins/reserveBook/extendExpiry
    const latestExpiry = member.coinExpiryOverride ? new Date(member.coinExpiryOverride) : null;

    const daysUntilExpiry = latestExpiry
        ? Math.ceil((latestExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div>
            <BackLink href="/members" label="กลับไปหน้าสมาชิก" />

            {/* Member Header */}
            <Card className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#81b29a]/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <User size={24} className="text-[#609279]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold text-[#3d405b]">{member.parentName}</h1>
                                <MemberEditForm member={JSON.parse(JSON.stringify(member))} />
                            </div>
                            <p className="text-sm text-[#3d405b]/50">{member.phone}</p>
                            <p className="text-xs text-[#3d405b]/40 font-mono mt-1 truncate">{member.qrCode}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right bg-emerald-50/50 sm:bg-transparent rounded-xl px-4 py-3 sm:p-0">
                        <p className="text-sm text-[#3d405b]/50">เหรียญคงเหลือ</p>
                        <p className="text-2xl font-bold text-emerald-600">{totalCoins}</p>
                        {latestExpiry && (
                            <p className={`text-xs mt-1 ${daysUntilExpiry !== null && daysUntilExpiry <= 7
                                ? "text-red-500 font-medium"
                                : "text-[#3d405b]/40"
                                }`}>
                                หมดอายุ {format(latestExpiry, "d MMM yyyy", { locale: th })}
                                {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                                    <span className="ml-1">({daysUntilExpiry <= 0 ? "หมดแล้ว!" : `อีก ${daysUntilExpiry} วัน`})</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Children */}
                {member.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#d1cce7]/20">
                        <p className="text-xs font-semibold text-[#3d405b]/40 uppercase mb-2">เด็ก</p>
                        <div className="flex gap-3 flex-wrap">
                            {member.children.map((c) => (
                                <div key={c.id} className="bg-[#81b29a]/10 px-4 py-2 rounded-xl">
                                    <p className="text-sm font-medium text-[#609279]">{c.name}</p>
                                    <p className="text-xs text-[#81b29a]">
                                        เกิด {format(new Date(c.birthDate), "d MMM yyyy", { locale: th })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <MemberActions member={member} packages={packageOptions} />

            {/* Coin Packages */}
            <Card padding={false} className="mb-6">
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        แพ็คเกจเหรียญ
                    </h2>
                </div>
                <div className="divide-y divide-[#d1cce7]/15">
                    {member.coinPackages.length === 0 ? (
                        <div className="p-6 text-center text-[#3d405b]/40 text-sm">ยังไม่มีแพ็คเกจเหรียญ</div>
                    ) : (
                        member.coinPackages.map((pkg) => (
                            <div key={pkg.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#3d405b]/80">
                                            {pkg.packageType.replace("_", " ")} — {pkg.totalCoins} เหรียญ
                                        </p>
                                        <p className="text-xs text-[#3d405b]/40">
                                            ราคา {Number(pkg.pricePaid).toLocaleString()} บาท
                                            {pkg.expiresAt &&
                                                ` · หมดอายุ ${format(new Date(pkg.expiresAt), "d MMM yyyy", { locale: th })}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${pkg.isExpired ? "text-red-500" : "text-emerald-600"}`}>
                                            {pkg.isExpired ? "หมดอายุ" : `${pkg.remainingCoins} เหรียญ`}
                                        </p>
                                        {pkg.isExtended && (
                                            <span className="text-xs text-amber-500">ขยายเวลาแล้ว</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Coin Movement History */}
            <Card padding={false} className="mb-6">
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <History size={18} className="text-violet-500" />
                        ประวัติการเคลื่อนไหวเหรียญ
                    </h2>
                </div>
                <MemberCoinHistory
                    packages={JSON.parse(JSON.stringify(member.coinPackages))}
                    borrowRecords={JSON.parse(JSON.stringify(member.borrowRecords))}
                    expiryLogs={JSON.parse(JSON.stringify(member.expiryLogs))}
                />
            </Card>

            {/* Borrow History */}
            <Card padding={false}>
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <BookOpen size={18} className="text-[#609279]" />
                        ประวัติยืมหนังสือ
                    </h2>
                </div>
                <div className="divide-y divide-[#d1cce7]/15">
                    {member.borrowRecords.length === 0 ? (
                        <div className="p-6 text-center text-[#3d405b]/40 text-sm">ยังไม่มีประวัติยืม</div>
                    ) : (
                        member.borrowRecords.map((b) => {
                            return (
                                <div key={b.id} className="px-6 py-4 hover:bg-[#f4f1de]/30 transition-colors">
                                    <Link href={`/borrows/${b.id}`} className="block">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-[#3d405b]/80">{b.code}</p>
                                            <StatusBadge status={b.status} />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {b.items.map((item) => (
                                                <span key={item.id} className="text-xs bg-[#d1cce7]/15 text-[#3d405b]/70 px-2 py-0.5 rounded-full">
                                                    {item.book.title}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[#3d405b]/40 mt-2">
                                            ยืม {format(new Date(b.borrowDate), "d MMM yyyy", { locale: th })}
                                            {" · "}กำหนดคืน {format(new Date(b.dueDate), "d MMM yyyy", { locale: th })}
                                        </p>
                                    </Link>
                                    {b.status === "RESERVED" && (
                                        <div className="mt-3 flex justify-end">
                                            <ConfirmReserveButton borrowId={b.id} hasActiveDeposit={member.borrowRecords.some(br => br.status === "BORROWED" && !br.depositReturned && !br.depositForfeited)} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}
