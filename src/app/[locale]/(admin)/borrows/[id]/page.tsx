import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, User, Calendar, Coins, Clock } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";
import ConfirmReserveButton from "../_components/ConfirmReserveButton";
import ReturnBookForm from "../_components/ReturnBookForm";
import { calculateLateFee } from "@/lib/utils";
import { getTranslations, getLocale } from "next-intl/server";

export default async function BorrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const t = await getTranslations("AdminBorrows.detail");
    const localeStr = await getLocale();
    const isThai = localeStr === "th";

    const { id } = await params;

    const record = await prisma.borrowRecord.findUnique({
        where: { id },
        include: {
            user: { include: { children: true } },
            items: { include: { book: true } },
            processedBy: true,
        },
    });

    if (!record) notFound();

    // Check if user has other active borrows (for deposit logic)
    let hasActiveDeposit = false;
    let hasOtherBorrows = false;
    if (record.status === "RESERVED" || record.status === "BORROWED" || record.status === "OVERDUE") {
        const otherBorrowedCount = await prisma.borrowRecord.count({
            where: {
                userId: record.userId,
                id: { not: record.id },
                status: "BORROWED",
                depositReturned: false,
                depositForfeited: false,
            },
        });
        hasActiveDeposit = otherBorrowedCount > 0;
        hasOtherBorrows = otherBorrowedCount > 0;
    }

    return (
        <div>
            {/* Back */}
            <Link href="/borrows" className="flex items-center gap-1.5 text-[#3d405b]/50 text-sm mb-4 hover:text-[#3d405b]/70 transition-colors">
                <ArrowLeft size={16} />
                {t("backToList")}
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#3d405b]">{t("title")}</h1>
                    <p className="text-sm text-[#3d405b]/40 font-mono mt-1">{record.code}</p>
                </div>
                <div className="flex items-center gap-3">
                    {record.status === "RESERVED" && (
                        <ConfirmReserveButton borrowId={record.id} hasActiveDeposit={hasActiveDeposit} />
                    )}
                    <StatusBadge status={record.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Borrower Info */}
                <Card>
                    <h3 className="font-semibold text-[#3d405b] flex items-center gap-2 mb-4">
                        <User size={16} className="text-[#609279]" />
                        {t("borrowerInfo.title")}
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("borrowerInfo.parentName")}</span>
                            <span className="font-medium text-[#3d405b]">{record.user.parentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("borrowerInfo.phone")}</span>
                            <span className="font-medium text-[#3d405b]">{record.user.phone}</span>
                        </div>
                        {record.user.children.length > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/50">{t("borrowerInfo.children")}</span>
                                <span className="font-medium text-[#3d405b]">
                                    {record.user.children.map(c => c.name).join(", ")}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Date Info */}
                <Card>
                    <h3 className="font-semibold text-[#3d405b] flex items-center gap-2 mb-4">
                        <Calendar size={16} className="text-[#a16b9f]" />
                        {t("dateInfo.title")}
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("dateInfo.borrowDate")}</span>
                            <span className="font-medium text-[#3d405b]">
                                {format(new Date(record.borrowDate), "d MMMM yyyy", { locale: isThai ? th : undefined })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("dateInfo.dueDate")}</span>
                            <span className="font-medium text-[#3d405b]">
                                {format(new Date(record.dueDate), "d MMMM yyyy", { locale: isThai ? th : undefined })}
                            </span>
                        </div>
                        {record.returnDate && (
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/50">{t("dateInfo.returnDate")}</span>
                                <span className="font-medium text-emerald-600">
                                    {format(new Date(record.returnDate), "d MMMM yyyy", { locale: isThai ? th : undefined })}
                                </span>
                            </div>
                        )}
                        {record.processedBy && (
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/50">{t("dateInfo.processedBy")}</span>
                                <span className="font-medium text-[#3d405b]">{record.processedBy.name}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Books */}
                <Card>
                    <h3 className="font-semibold text-[#3d405b] flex items-center gap-2 mb-4">
                        <BookOpen size={16} className="text-[#609279]" />
                        {t("booksInfo.title", { count: record.items.length })}
                    </h3>
                    <div className="space-y-3">
                        {record.items.map((item) => (
                            <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${item.returned ? 'bg-emerald-50/50 opacity-60' : 'bg-[#f4f1de]/30'}`}>
                                <div>
                                    <p className={`font-medium text-[#3d405b] text-sm ${item.returned ? 'line-through' : ''}`}>{item.book.title}</p>
                                    {item.book.category && (
                                        <p className="text-xs text-[#3d405b]/40 mt-0.5">{item.book.category}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {item.returned && (
                                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                            {t("coinsInfo.depositReturned").replace("✓ ", "")}
                                        </span>
                                    )}
                                    {item.isDamaged && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                            ชำรุด
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Coins */}
                <Card>
                    <h3 className="font-semibold text-[#3d405b] flex items-center gap-2 mb-4">
                        <Coins size={16} className="text-[#a16b9f]" />
                        {t("coinsInfo.title")}
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("coinsInfo.rental")}</span>
                            <span className="font-medium text-[#609279]">{record.rentalCoins}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#3d405b]/50">{t("coinsInfo.deposit")}</span>
                            <span className="font-medium text-[#a16b9f]">{record.depositCoins}</span>
                        </div>
                        {record.lateFeeCoins > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/50">{t("coinsInfo.lateFee")}</span>
                                <span className="font-medium text-red-500">{record.lateFeeCoins}</span>
                            </div>
                        )}
                        {record.damageFeeCoins > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/50">{t("coinsInfo.damageFee")}</span>
                                <span className="font-medium text-red-500">{record.damageFeeCoins}</span>
                            </div>
                        )}
                        <div className="border-t border-[#d1cce7]/20 pt-2 flex justify-between font-semibold">
                            <span className="text-[#3d405b]">{t("coinsInfo.total")}</span>
                            <span className="text-[#3d405b]">
                                {record.rentalCoins + record.depositCoins + record.lateFeeCoins + record.damageFeeCoins}
                            </span>
                        </div>
                        {record.depositReturned && (
                            <p className="text-xs text-emerald-600">{t("coinsInfo.depositReturned")}</p>
                        )}
                        {record.depositForfeited && (
                            <p className="text-xs text-red-500">{t("coinsInfo.depositForfeited")}</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Note */}
            {record.note && (
                <Card className="mt-4">
                    <h3 className="font-semibold text-[#3d405b] flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-[#3d405b]/40" />
                        {t("note.title")}
                    </h3>
                    <p className="text-sm text-[#3d405b]/60">{record.note}</p>
                </Card>
            )}

            {/* Return Book Form - only for BORROWED or OVERDUE */}
            {(record.status === "BORROWED" || record.status === "OVERDUE") && (() => {
                const now = new Date();
                const preview = calculateLateFee(new Date(record.dueDate), now);
                return (
                    <ReturnBookForm
                        borrowId={record.id}
                        items={record.items.map(item => ({
                            id: item.id,
                            bookId: item.bookId,
                            returned: item.returned,
                            book: { title: item.book.title, category: item.book.category },
                        }))}
                        dueDate={record.dueDate.toISOString()}
                        depositCoins={record.depositCoins}
                        hasOtherBorrows={hasOtherBorrows}
                        lateFeePreview={preview}
                    />
                );
            })()}
        </div>
    );
}
