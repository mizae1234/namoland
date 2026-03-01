import { getBorrows } from "@/actions/borrow";
import Link from "next/link";
import { ArrowLeftRight, QrCode } from "lucide-react";
import { format, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import BorrowFilters from "./_components/BorrowFilters";
import ConfirmReserveButton from "./_components/ConfirmReserveButton";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function BorrowsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; from?: string; to?: string }>;
}) {
    const params = await searchParams;

    // Default date range: 1 month
    const today = new Date();
    const defaultFrom = format(subMonths(today, 1), "yyyy-MM-dd");
    const defaultTo = format(today, "yyyy-MM-dd");

    const from = params.from || defaultFrom;
    const to = params.to || defaultTo;

    const borrows = await getBorrows({
        search: params.search,
        from,
        to,
    });

    return (
        <div>
            <PageHeader
                title="ยืม-คืนหนังสือ"
                subtitle="จัดการรายการยืม-คืนทั้งหมด"
                actionHref="/borrows/scan"
                actionLabel="สแกน QR"
                actionIcon={<QrCode size={18} />}
            />

            {/* Filters */}
            <BorrowFilters
                defaultSearch={params.search || ""}
                defaultFrom={from}
                defaultTo={to}
            />

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">
                    พบ {borrows.length} รายการ
                </p>
            </div>

            <Card padding={false} className="overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">รหัส</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ผู้ยืม</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">หนังสือ</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">วันยืม</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">กำหนดคืน</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">คืนวันที่</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">สถานะ</th>
                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {borrows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                    <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-50" />
                                    ไม่พบรายการยืมในช่วงเวลาที่เลือก
                                </td>
                            </tr>
                        ) : (
                            borrows.map((b) => {
                                return (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{b.code}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">{b.user.parentName}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {b.items.map((item) => (
                                                    <span key={item.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                        {item.book.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {format(new Date(b.borrowDate), "d MMM yy", { locale: th })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {format(new Date(b.dueDate), "d MMM yy", { locale: th })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {b.returnDate
                                                ? format(new Date(b.returnDate), "d MMM yy", { locale: th })
                                                : <span className="text-slate-300">—</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            {b.status === "RESERVED" && (
                                                <ConfirmReserveButton borrowId={b.id} />
                                            )}
                                            <Link
                                                href={`/borrows/${b.id}`}
                                                className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                                            >
                                                ดู →
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
