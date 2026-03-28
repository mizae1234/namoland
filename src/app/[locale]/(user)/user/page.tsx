import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BookOpen, QrCode, Coins, Youtube, Plus, CalendarDays, Clock, Check } from "lucide-react";



export default async function UserHomePage() {
    const t = await getTranslations("UserDashboard");
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            children: true,
            coinPackages: { where: { isExpired: false, remainingCoins: { gt: 0 } } },
            borrowRecords: { where: { status: "BORROWED" }, include: { items: { include: { book: true } } } },
        },
    });

    if (!user) return <div className="p-4 text-center text-[#3d405b]/40">{t("notFound")}</div>;

    const totalCoins = user.coinPackages.reduce((s, p) => s + p.remainingCoins, 0);
    const activeBorrows = user.borrowRecords.length;

    // Effective expiry — auto-maintained by actions
    const latestExpiry = user.coinExpiryOverride ? new Date(user.coinExpiryOverride) : null;
    const now = new Date();
    const daysLeft = latestExpiry
        ? Math.ceil((latestExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const youtubeBooks = await prisma.book.findMany({
        where: { youtubeUrl: { not: null } },
        take: 3,
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-4">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-[#609279] to-[#a16b9f] rounded-2xl p-6 text-white mb-6 shadow-lg">
                <h1 className="text-xl font-bold">{t("welcome", { name: user.parentName })}</h1>
                <p className="text-white/60 text-sm mt-1">{t("subtitle")}</p>
                <div className="flex gap-3 mt-4">
                    <Link
                        href="/user/qr"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                        <QrCode size={16} />
                        QR Code
                    </Link>
                    <Link
                        href="/user/youtube"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                        <Youtube size={16} />
                        YouTube
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 border border-[#d1cce7]/20">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Coins size={18} className="text-amber-500" />
                            <span className="text-xs text-[#3d405b]/50">{t("stats.coins")}</span>
                        </div>
                        <Link
                            href="/user/coins/top-up"
                            className="flex items-center gap-0.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-medium hover:bg-amber-100 transition-colors"
                        >
                            <Plus size={10} />
                            {t("stats.topup")}
                        </Link>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">{totalCoins}</p>
                    {latestExpiry && totalCoins > 0 && (
                        <p className={`text-[10px] mt-1 ${daysLeft !== null && daysLeft <= 7 ? "text-red-500 font-medium" : "text-[#3d405b]/35"
                            }`}>
                            {t("stats.expirePrefix")} {latestExpiry.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                            {daysLeft !== null && daysLeft <= 7 && (
                                <span> ({daysLeft <= 0 ? t("stats.expireSoon") : t("stats.expireDays", { days: daysLeft })})</span>
                            )}
                        </p>
                    )}
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#d1cce7]/20">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={18} className="text-[#609279]" />
                        <span className="text-xs text-[#3d405b]/50">{t("stats.borrows")}</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3d405b]">{activeBorrows} <span className="text-sm font-normal text-[#3d405b]/40">{t("stats.items")}</span></p>
                </div>
            </div>

            {/* Upcoming Bookings */}
            <UpcomingBookings userId={userId} />

            {/* Current Borrows */}
            {user.borrowRecords.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-semibold text-[#3d405b] mb-3">{t("borrows.title")}</h2>
                    <div className="space-y-2">
                        {user.borrowRecords.flatMap((br) =>
                            br.items.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl p-3 border border-[#d1cce7]/20 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#81b29a]/15 rounded-lg flex items-center justify-center">
                                        <BookOpen size={18} className="text-[#609279]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#3d405b]/80">{item.book.title}</p>
                                        <p className="text-xs text-[#3d405b]/40">
                                            {t("borrows.dueDate")} {new Date(br.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* YouTube books preview */}
            {youtubeBooks.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-[#3d405b]">{t("youtube.title")}</h2>
                        <Link href="/user/youtube" className="text-xs text-[#609279] font-medium">{t("youtube.seeAll")}</Link>
                    </div>
                    <div className="space-y-2">
                        {youtubeBooks.map((book) => (
                            <a
                                key={book.id}
                                href={book.youtubeUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#d1cce7]/20 hover:shadow-sm transition-shadow"
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Youtube size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#3d405b]/80">{book.title}</p>
                                    <p className="text-xs text-[#3d405b]/40">{book.category || t("youtube.defaultCategory")}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

async function UpcomingBookings({ userId }: { userId: string }) {
    const t = await getTranslations("UserDashboard");
    const bookings = await prisma.classBooking.findMany({
        where: { userId, status: "BOOKED" },
        include: {
            classEntry: true,
            child: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#3d405b] flex items-center gap-1.5">
                    <CalendarDays size={16} className="text-[#a16b9f]" />
                    {t("bookings.title")}
                </h2>
                <Link href="/user/classes" className="text-xs text-[#609279] font-medium">{t("bookings.seeAll")}</Link>
            </div>
            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl p-4 border border-[#d1cce7]/20 text-center">
                    <CalendarDays size={24} className="mx-auto text-[#3d405b]/10 mb-1" />
                    <p className="text-xs text-[#3d405b]/30">{t("bookings.empty")}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {bookings.map((b) => (
                        <div key={b.id} className="bg-white rounded-xl p-3 border border-[#d1cce7]/20 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#a16b9f]/10 rounded-lg flex items-center justify-center">
                                <CalendarDays size={18} className="text-[#a16b9f]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#3d405b]/80 truncate">{b.classEntry.title}</p>
                                <p className="text-xs text-[#3d405b]/40">
                                    {t(`days.${b.classEntry.dayOfWeek}`)} {b.classEntry.startTime}-{b.classEntry.endTime}
                                    {b.child && ` • ${b.child.name}`}
                                </p>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium flex items-center gap-0.5">
                                <Clock size={9} /> {t("bookings.waiting")}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
