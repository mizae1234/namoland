import { getMembers } from "@/actions/member";
import Link from "next/link";
import { Users } from "lucide-react";
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

            <Card padding={false} className="overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ผู้ปกครอง</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">เบอร์โทร</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">เด็ก</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">เหรียญคงเหลือ</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ยืมหนังสือ</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {members.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    ยังไม่มีสมาชิก
                                </td>
                            </tr>
                        ) : (
                            members.map((m) => {
                                const totalCoins = m.coinPackages.reduce((s, p) => s + p.remainingCoins, 0);
                                return (
                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-700">{m.parentName}</p>
                                            <p className="text-xs text-slate-400">{m.qrCode}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{m.phone}</td>
                                        <td className="px-6 py-4">
                                            {m.children.map((c) => (
                                                <span key={c.id} className="inline-block bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                                                    {c.name}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-emerald-600">{totalCoins} เหรียญ</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{m._count.borrowRecords} ครั้ง</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/members/${m.id}`}
                                                className="text-sm text-blue-500 hover:text-blue-700 font-medium"
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
        </div>
    );
}
