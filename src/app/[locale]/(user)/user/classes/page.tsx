import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CalendarDays, Check, Clock, XCircle, Ban, Coins } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; Icon: typeof Check }> = {
    BOOKED: { color: "text-blue-600", bgColor: "bg-blue-50", Icon: Clock },
    CHECKED_IN: { color: "text-emerald-600", bgColor: "bg-emerald-50", Icon: Check },
    CANCELLED: { color: "text-gray-400", bgColor: "bg-gray-50", Icon: XCircle },
    NO_SHOW: { color: "text-red-500", bgColor: "bg-red-50", Icon: Ban },
};

// DAY_LABELS removed — component uses t('days.X') from next-intl

export default async function UserClassesPage() {
    const t = await getTranslations("UserClasses");
    const locale = await getLocale();
    const dateLocale = locale === "en" ? enUS : th;
    const session = await auth();
    const userId = session!.user.id;

    const bookings = await prisma.classBooking.findMany({
        where: { userId },
        include: {
            classEntry: {
                include: {
                    schedule: { select: { startDate: true, endDate: true, theme: true } },
                },
            },
            child: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const manualTxs = await prisma.coinTransaction.findMany({
        where: {
            package: { userId },
            type: "CLASS_FEE",
            NOT: { description: { startsWith: "Check-in:" } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const manualBookings = manualTxs.map((tx) => ({
        id: tx.id,
        status: "CHECKED_IN",
        coinsCharged: tx.coinsUsed,
        createdAt: tx.createdAt,
        classEntry: {
            title: tx.className || tx.description || "Activity",
            dayOfWeek: tx.createdAt.getDay() === 0 ? 7 : tx.createdAt.getDay(),
            startTime: "-",
            endTime: "-",
            schedule: {
                startDate: tx.createdAt,
                theme: tx.description !== tx.className ? tx.description : null,
            }
        },
        child: null,
    }));

    // Group by status
    const upcoming = bookings.filter((b) => b.status === "BOOKED");
    const past = [...bookings.filter((b) => b.status !== "BOOKED"), ...manualBookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Link href="/user" className="text-[#3d405b]/40 hover:text-[#3d405b] text-sm">{t("back")}</Link>
            </div>
            <h1 className="text-xl font-bold text-[#3d405b] mb-1 flex items-center gap-2">
                <CalendarDays size={22} className="text-[#a16b9f]" />
                {t("title")}
            </h1>
            <p className="text-xs text-[#3d405b]/40 mb-6">{t("description")}</p>

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                        <Clock size={14} />
                        {t("upcomingTitle")} ({upcoming.length})
                    </h2>
                    <div className="space-y-2">
                        {upcoming.map((b) => (
                            <BookingCard key={b.id} booking={b} t={t} dateLocale={dateLocale} />
                        ))}
                    </div>
                </div>
            )}

            {/* History */}
            <div>
                <h2 className="text-sm font-bold text-[#3d405b]/50 mb-3">{t("pastTitle")}</h2>
                {past.length === 0 && upcoming.length === 0 ? (
                    <div className="text-center py-10">
                        <CalendarDays size={40} className="mx-auto text-[#3d405b]/10 mb-3" />
                        <p className="text-sm text-[#3d405b]/30">{t("emptyAll")}</p>
                    </div>
                ) : past.length === 0 ? (
                    <p className="text-xs text-[#3d405b]/30 text-center py-4">{t("emptyHistory")}</p>
                ) : (
                    <div className="space-y-2">
                        {past.map((b) => (
                            <BookingCard key={b.id} booking={b} t={t} dateLocale={dateLocale} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BookingCard({ booking: b, t, dateLocale }: { booking: any; t: any; dateLocale: any }) {
    const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.BOOKED;
    const statusLabel = t(`status.${b.status}`);
    const Icon = status.Icon;
    const scheduleDate = b.classEntry.schedule.startDate
        ? format(new Date(b.classEntry.schedule.startDate), "d MMM yy", { locale: dateLocale })
        : "";

    let exactClassDate = "";
    if (b.classEntry.schedule.startDate) {
        const d = new Date(b.classEntry.schedule.startDate);
        d.setDate(d.getDate() + (b.classEntry.dayOfWeek - 1));
        exactClassDate = format(d, "d MMM yy", { locale: dateLocale });
    }

    return (
        <div className={`rounded-xl p-3 border border-[#d1cce7]/15 ${b.status === "BOOKED" ? "bg-white" : "bg-gray-50/50"}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#3d405b] truncate">{b.classEntry.title}</p>
                    <p className="text-xs text-[#3d405b]/60 mt-0.5 font-medium">
                        {t(`days.${b.classEntry.dayOfWeek}`)} {exactClassDate} • <span className="text-[#3d405b]/40 font-normal">{b.classEntry.startTime}-{b.classEntry.endTime}</span>
                    </p>
                    <p className="text-[10px] text-[#3d405b]/30 mt-0.5">
                        {t("card.week")} {scheduleDate}
                        {b.classEntry.schedule.theme && ` • ${b.classEntry.schedule.theme}`}
                    </p>
                    {b.child && (
                        <p className="text-[10px] text-[#a16b9f]/60 mt-0.5">{t("card.child")}: {b.child.name}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`${status.bgColor} ${status.color} px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1`}>
                        <Icon size={10} />
                        {statusLabel}
                    </span>
                    {b.coinsCharged > 0 && b.status === "CHECKED_IN" && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <Coins size={9} /> -{b.coinsCharged}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
