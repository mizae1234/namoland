import { getBorrows, getUsersWithActiveDeposit } from "@/actions/borrow";
import Link from "next/link";
import { ArrowLeftRight, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import BorrowFilters from "./_components/BorrowFilters";
import ConfirmReserveButton from "./_components/ConfirmReserveButton";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { getTranslations, getLocale } from "next-intl/server";

const PAGE_SIZE = 15;

/** Build visible page numbers with ellipsis for large page counts */
function getVisiblePages(current: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | null)[] = [1];
    if (current > 3) pages.push(null); // ellipsis
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push(null); // ellipsis
    pages.push(total);
    return pages;
}

export default async function BorrowsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; from?: string; to?: string; page?: string }>;
}) {
    const t = await getTranslations("AdminBorrows");
    const localeStr = await getLocale();
    const isThai = localeStr === "th";

    const params = await searchParams;

    // Default date range: 1 month
    const today = new Date();
    const defaultFrom = format(subMonths(today, 1), "yyyy-MM-dd");
    const defaultTo = format(today, "yyyy-MM-dd");

    const from = params.from || defaultFrom;
    const to = params.to || defaultTo;
    const currentPage = Math.max(1, parseInt(params.page || "1"));

    const { records: borrows, totalCount: totalRecords } = await getBorrows({
        search: params.search,
        from,
        to,
        page: currentPage,
        pageSize: PAGE_SIZE,
    });

    // Pre-compute which RESERVED users already have active deposit (shared service)
    const reservedUserIds = [...new Set(borrows.filter(b => b.status === "RESERVED").map(b => b.userId))];
    const usersWithDeposit = await getUsersWithActiveDeposit(reservedUserIds);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    // Build pagination URL helper
    const buildPageUrl = (page: number) => {
        const p = new URLSearchParams();
        if (params.search) p.set("search", params.search);
        if (params.from) p.set("from", params.from);
        if (params.to) p.set("to", params.to);
        p.set("page", String(page));
        return `/borrows?${p.toString()}`;
    };

    return (
        <div>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                actionHref="/borrows/scan"
                actionLabel={t("scanQr")}
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
                <p className="text-sm text-[#3d405b]/40">
                    {t("resultsCount", { count: totalRecords })}
                    {totalPages > 1 && ` · ${t("pageInfo", { current: safePage, total: totalPages })}`}
                </p>
            </div>

            <Card padding={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-[#f4f1de]/50 border-b border-[#d1cce7]/20">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.code")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.borrower")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.book")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.borrowDate")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.dueDate")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.returnDate")}</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap">{t("table.status")}</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-[#3d405b]/50 uppercase whitespace-nowrap"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1cce7]/15">
                            {borrows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-[#3d405b]/40">
                                        <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-50" />
                                        {t("table.empty")}
                                    </td>
                                </tr>
                            ) : (
                                borrows.map((b) => {
                                    return (
                                        <tr key={b.id} className="hover:bg-[#f4f1de]/30">
                                            <td className="px-6 py-4 text-sm font-mono text-[#3d405b]/70 whitespace-nowrap">{b.code}</td>
                                            <td className="px-6 py-4 text-sm text-[#3d405b]/80 font-medium whitespace-nowrap">{b.user.parentName}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap max-w-[250px]">
                                                    {b.items.map((item) => (
                                                        <span key={item.id} className="text-xs bg-[#d1cce7]/15 text-[#3d405b]/70 px-2 py-0.5 rounded-full">
                                                            {item.book.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#3d405b]/50 whitespace-nowrap">
                                                {format(new Date(b.borrowDate), "d MMM yy", { locale: isThai ? th : undefined })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#3d405b]/50 whitespace-nowrap">
                                                {format(new Date(b.dueDate), "d MMM yy", { locale: isThai ? th : undefined })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#3d405b]/50 whitespace-nowrap">
                                                {b.returnDate
                                                    ? format(new Date(b.returnDate), "d MMM yy", { locale: isThai ? th : undefined })
                                                    : <span className="text-[#3d405b]/30">—</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={b.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {b.status === "RESERVED" && (
                                                        <ConfirmReserveButton borrowId={b.id} hasActiveDeposit={usersWithDeposit.has(b.userId)} />
                                                    )}
                                                    <Link
                                                        href={`/borrows/${b.id}`}
                                                        className="text-sm text-[#609279] hover:text-[#81b29a] font-medium"
                                                    >
                                                        {t("table.view")}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    {safePage > 1 ? (
                        <Link
                            href={buildPageUrl(safePage - 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-[#3d405b]/60 bg-white border border-[#d1cce7]/30 rounded-xl hover:bg-[#f4f1de]/50 transition-colors"
                        >
                            <ChevronLeft size={14} />
                            {t("pagination.previous")}
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1 px-3 py-2 text-sm text-[#3d405b]/20 border border-[#d1cce7]/15 rounded-xl cursor-not-allowed">
                            <ChevronLeft size={14} />
                            {t("pagination.previous")}
                        </span>
                    )}

                    <div className="flex items-center gap-1">
                        {getVisiblePages(safePage, totalPages).map((page, idx) => (
                            page === null ? (
                                <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-sm text-[#3d405b]/30">…</span>
                            ) : (
                                <Link
                                    key={page}
                                    href={buildPageUrl(page)}
                                    className={`w-9 h-9 flex items-center justify-center text-sm rounded-xl transition-colors ${page === safePage
                                            ? "bg-[#609279] text-white font-semibold shadow-md shadow-[#609279]/20"
                                            : "text-[#3d405b]/50 hover:bg-[#f4f1de]/50"
                                        }`}
                                >
                                    {page}
                                </Link>
                            )
                        ))}
                    </div>

                    {safePage < totalPages ? (
                        <Link
                            href={buildPageUrl(safePage + 1)}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-[#3d405b]/60 bg-white border border-[#d1cce7]/30 rounded-xl hover:bg-[#f4f1de]/50 transition-colors"
                        >
                            {t("pagination.next")}
                            <ChevronRight size={14} />
                        </Link>
                    ) : (
                        <span className="flex items-center gap-1 px-3 py-2 text-sm text-[#3d405b]/20 border border-[#d1cce7]/15 rounded-xl cursor-not-allowed">
                            {t("pagination.next")}
                            <ChevronRight size={14} />
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
