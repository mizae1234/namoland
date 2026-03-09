import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookOpen, ArrowLeft, Youtube, Coins, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import ReserveButton from "./_components/ReserveButton";
import { BORROW_DEPOSIT_COINS } from "@/lib/constants";

export default async function UserBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") redirect("/user/login");

    const { id } = await params;

    const book = await prisma.book.findUnique({
        where: { id },
        include: {
            borrowItems: {
                where: {
                    borrowRecord: { status: { in: ["RESERVED", "BORROWED"] } },
                },
                include: {
                    borrowRecord: {
                        select: { userId: true, status: true },
                    },
                },
            },
        },
    });

    if (!book || !book.isActive) notFound();

    const rentalCost = book.rentalCost;

    // Check user's coin balance
    const packages = await prisma.coinPackage.findMany({
        where: { userId: session.user.id, isExpired: false, remainingCoins: { gt: 0 } },
    });
    const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);

    // Check if user already reserved this book
    const existingReservation = await prisma.borrowRecord.findFirst({
        where: {
            userId: session.user.id,
            status: "RESERVED",
            items: { some: { bookId: id } },
        },
    });

    // Check if user already has active deposit (BORROWED books)
    const activeBorrowedCount = await prisma.borrowRecord.count({
        where: {
            userId: session.user.id,
            status: "BORROWED",
            depositReturned: false,
            depositForfeited: false,
        },
    });
    const hasActiveDeposit = activeBorrowedCount > 0;
    const effectiveDeposit = hasActiveDeposit ? 0 : BORROW_DEPOSIT_COINS;

    const isReservedByUser = !!existingReservation;
    const isBorrowed = !book.isAvailable && !isReservedByUser;

    return (
        <div className="p-4">
            {/* Back */}
            <Link href="/user/books" className="flex items-center gap-1.5 text-[#3d405b]/50 text-sm mb-4 hover:text-[#3d405b]/70 transition-colors">
                <ArrowLeft size={16} />
                กลับรายการหนังสือ
            </Link>

            {/* Book Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20 shadow-sm">
                {/* Book Icon / Cover */}
                <div className="w-20 h-20 bg-gradient-to-br from-[#609279]/10 to-[#a16b9f]/10 rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen size={36} className="text-[#609279]" />
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-[#3d405b] mb-2">{book.title}</h1>

                {/* Meta */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {book.category && (
                        <span className="text-xs bg-[#a16b9f]/10 text-[#a16b9f] px-2.5 py-1 rounded-full font-medium">
                            {book.category}
                        </span>
                    )}
                    {book.ageRange && (
                        <span className="text-xs bg-[#81b29a]/10 text-[#609279] px-2.5 py-1 rounded-full font-medium">
                            {book.ageRange}
                        </span>
                    )}
                    {book.isbn && (
                        <span className="text-xs bg-[#f4f1de] text-[#3d405b]/50 px-2.5 py-1 rounded-full">
                            ISBN: {book.isbn}
                        </span>
                    )}
                </div>

                {/* Status */}
                <div className="mb-6">
                    {isReservedByUser ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#a16b9f]/10 rounded-xl text-sm text-[#a16b9f] font-medium">
                            <Coins size={16} />
                            คุณจองหนังสือเล่มนี้อยู่ (รอ Admin อนุมัติ)
                        </div>
                    ) : isBorrowed ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl text-sm text-amber-600 font-medium">
                            <BookOpen size={16} />
                            หนังสือถูกยืมอยู่
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl text-sm text-emerald-600 font-medium">
                            <BookOpen size={16} />
                            ว่าง — พร้อมให้จอง
                        </div>
                    )}
                </div>

                {/* YouTube */}
                {book.youtubeUrl && (
                    <a
                        href={book.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mb-6 px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                        <Youtube size={18} />
                        ดู YouTube — อ่านเล่มนี้
                    </a>
                )}

                {/* Coin Cost */}
                {book.isAvailable && !isReservedByUser && (
                    <div className="bg-[#f4f1de]/50 rounded-xl p-4 mb-6">
                        <h3 className="text-sm font-semibold text-[#3d405b] mb-3">ค่าใช้จ่าย</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[#3d405b]/60">ค่ายืม (หักทันทีเมื่อจอง)</span>
                                <span className="font-medium text-[#609279]">{rentalCost} เหรียญ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#3d405b]/60">ค่ามัดจำ (หักเมื่อ Admin อนุมัติ)</span>
                                {hasActiveDeposit ? (
                                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                        <CheckCircle2 size={12} />
                                        มัดจำแล้ว (ไม่หักเพิ่ม)
                                    </span>
                                ) : (
                                    <span className="font-medium text-[#a16b9f]">{BORROW_DEPOSIT_COINS} เหรียญ</span>
                                )}
                            </div>
                            <div className="border-t border-[#d1cce7]/20 pt-2 flex justify-between font-semibold">
                                <span className="text-[#3d405b]">รวมทั้งหมด</span>
                                <span className="text-[#3d405b]">{rentalCost + effectiveDeposit} เหรียญ</span>
                            </div>
                        </div>
                        {hasActiveDeposit && (
                            <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                คุณมีมัดจำอยู่แล้ว (ยืมได้สูงสุด 5 เล่ม, ตอนนี้ยืมอยู่ {activeBorrowedCount} เล่ม)
                            </p>
                        )}
                        <p className="text-xs text-[#3d405b]/40 mt-2">
                            เหรียญของคุณ: <span className="font-semibold text-[#609279]">{totalCoins}</span> เหรียญ
                        </p>
                    </div>
                )}

                {/* Reserve Button */}
                {book.isAvailable && !isReservedByUser && (
                    <ReserveButton
                        bookId={book.id}
                        bookTitle={book.title}
                        rentalCoins={rentalCost}
                        hasEnoughCoins={totalCoins >= rentalCost}
                        hasActiveDeposit={hasActiveDeposit}
                    />
                )}
            </div>
        </div>
    );
}
