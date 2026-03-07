import { getMembers } from "@/actions/member";
import Link from "next/link";
import { Users, ChevronRight, Coins } from "lucide-react";
import MemberSearch from "./_components/MemberSearch";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string }>;
}) {
    const params = await searchParams;
    const members = await getMembers(params.search);

    return (
        <div>
            <PageHeader
                title="สมาชิก"
                subtitle="จัดการข้อมูลสมาชิกทั้งหมด"
                actionHref="/members/new"
                actionLabel="เพิ่มสมาชิก"
            />

            <MemberSearch defaultValue={params.search} />

            {/* Desktop Table */}
            <Card padding={false} className="overflow-hidden hidden md:block">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/20">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase">ผู้ปกครอง</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase">เบอร์โทร</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase">เด็ก</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase">เหรียญคงเหลือ</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase">ยืมหนังสือ</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d1cce7]/15">
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-[#3d405b]/40">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    ยังไม่มีสมาชิก
                                </td>
                            </tr>
                        ) : (
                            members.map((m) => {
                                const totalCoins = m.coinPackages.reduce((s: number, p: { remainingCoins: number }) => s + p.remainingCoins, 0);
                                return (
                                    <tr key={m.id} className="hover:bg-[#f4f1de]/50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-[#3d405b]/80">{m.parentName}</p>
                                            <p className="text-xs text-[#3d405b]/40">{m.qrCode}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#3d405b]/70">{m.phone}</td>
                                        <td className="px-6 py-4">
                                            {m.children.map((c: { id: string; name: string }) => (
                                                <span key={c.id} className="inline-block bg-[#81b29a]/10 text-[#609279] text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                                                    {c.name}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-emerald-600">{totalCoins} เหรียญ</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#3d405b]/70">{m._count.borrowRecords} ครั้ง</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/members/${m.id}`}
                                                className="text-sm text-[#609279] hover:text-[#609279] font-medium"
                                            >
                                                ดูรายละเอียด →
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
                {members.length === 0 ? (
                    <Card>
                        <div className="text-center py-8 text-[#3d405b]/40">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p>ยังไม่มีสมาชิก</p>
                        </div>
                    </Card>
                ) : (
                    members.map((m) => {
                        const totalCoins = m.coinPackages.reduce((s: number, p: { remainingCoins: number }) => s + p.remainingCoins, 0);
                        return (
                            <Link key={m.id} href={`/members/${m.id}`} className="block">
                                <Card className="active:scale-[0.98] transition-transform">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-[#3d405b] truncate">{m.parentName}</p>
                                            </div>
                                            <p className="text-xs text-[#3d405b]/40 mb-2">{m.phone}</p>

                                            {m.children.length > 0 && (
                                                <div className="flex gap-1 flex-wrap mb-2">
                                                    {m.children.map((c: { id: string; name: string }) => (
                                                        <span key={c.id} className="bg-[#81b29a]/10 text-[#609279] text-xs px-2 py-0.5 rounded-full">
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-[#3d405b]/50">
                                                <span className="flex items-center gap-1">
                                                    <Coins size={12} className="text-emerald-500" />
                                                    <span className="font-semibold text-emerald-600">{totalCoins}</span> เหรียญ
                                                </span>
                                                <span>ยืม {m._count.borrowRecords} ครั้ง</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-[#3d405b]/20 flex-shrink-0 ml-2" />
                                    </div>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
