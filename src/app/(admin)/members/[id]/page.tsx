import { getMemberById } from "@/actions/member";
import { notFound } from "next/navigation";
import { User, Coins, BookOpen, History } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import MemberActions from "./_components/MemberActions";
import MemberCoinHistory from "./_components/MemberCoinHistory";
import BackLink from "@/components/ui/BackLink";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const member = await getMemberById(id);

    if (!member) notFound();

    const totalCoins = member.coinPackages
        .filter((p) => !p.isExpired && p.remainingCoins > 0)
        .reduce((s, p) => s + p.remainingCoins, 0);

    return (
        <div>
            <BackLink href="/members" label="กลับไปหน้าสมาชิก" />

            {/* Member Header */}
            <Card className="mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <User size={28} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">{member.parentName}</h1>
                            <p className="text-sm text-slate-500">{member.phone}</p>
                            <p className="text-xs text-slate-400 font-mono mt-1">{member.qrCode}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">เหรียญคงเหลือ</p>
                        <p className="text-2xl font-bold text-emerald-600">{totalCoins}</p>
                    </div>
                </div>

                {/* Children */}
                {member.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase mb-2">เด็ก</p>
                        <div className="flex gap-3 flex-wrap">
                            {member.children.map((c) => (
                                <div key={c.id} className="bg-blue-50 px-4 py-2 rounded-xl">
                                    <p className="text-sm font-medium text-blue-700">{c.name}</p>
                                    <p className="text-xs text-blue-400">
                                        เกิด {format(new Date(c.birthDate), "d MMM yyyy", { locale: th })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <MemberActions member={member} />

            {/* Coin Packages */}
            <Card padding={false} className="mb-6">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        แพ็คเกจเหรียญ
                    </h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {member.coinPackages.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีแพ็คเกจเหรียญ</div>
                    ) : (
                        member.coinPackages.map((pkg) => (
                            <div key={pkg.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            {pkg.packageType.replace("_", " ")} — {pkg.totalCoins} เหรียญ
                                        </p>
                                        <p className="text-xs text-slate-400">
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

            {/* Coin History */}
            <Card padding={false} className="mb-6">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <History size={18} className="text-violet-500" />
                        ประวัติเหรียญ
                    </h2>
                </div>
                <div className="p-2">
                    <MemberCoinHistory packages={JSON.parse(JSON.stringify(member.coinPackages))} />
                </div>
            </Card>

            {/* Borrow History */}
            <Card padding={false}>
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-500" />
                        ประวัติยืมหนังสือ
                    </h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {member.borrowRecords.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีประวัติยืม</div>
                    ) : (
                        member.borrowRecords.map((b) => {
                            return (
                                <div key={b.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-slate-700">{b.code}</p>
                                        <StatusBadge status={b.status} />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {b.items.map((item) => (
                                            <span key={item.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {item.book.title}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        ยืม {format(new Date(b.borrowDate), "d MMM yyyy", { locale: th })}
                                        {" · "}กำหนดคืน {format(new Date(b.dueDate), "d MMM yyyy", { locale: th })}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}
