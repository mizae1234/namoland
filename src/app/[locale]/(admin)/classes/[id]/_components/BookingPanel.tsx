"use client";

import { useState, useEffect } from "react";
import {
    searchMembersForBooking,
    bookClassForMember,
    checkInBooking,
    cancelBooking,
    markNoShow,
    getBookingsByEntry,
} from "@/actions/classBooking";
import {
    Search,
    X,
    UserPlus,
    Check,
    XCircle,
    Ban,
    Clock,
    Users,
    Coins,
} from "lucide-react";
import AlertMessage from "@/components/ui/AlertMessage";
import { useTranslations } from "next-intl";

interface EntryData {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title: string;
}

interface BookingData {
    id: string;
    status: string;
    coinsCharged: number;
    checkedInAt: string | null;
    note: string | null;
    createdAt: string;
    user: { id: string; parentName: string; phone: string };
    child: { id: string; name: string } | null;
    bookedBy: { name: string };
}

interface MemberResult {
    id: string;
    parentName: string;
    phone: string;
    children: { id: string; name: string }[];
    packages: { id: string; packageType: string; remainingCoins: number }[];
    totalCoins: number;
}

const DAY_LABELS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์", "อาทิตย์"];

export default function BookingPanel({
    entry,
    onClose,
}: {
    entry: EntryData;
    onClose: () => void;
}) {
    const t = useTranslations("AdminClasses.bookingPanel");
    const tWeek = useTranslations("AdminClasses.weeklyCalendar");
    const DAY_LABELS = tWeek.raw("dayLabelsTh") as string[];

    const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        BOOKED: { label: t("statusBooked"), color: "bg-blue-100 text-blue-700", icon: <Clock size={12} /> },
        CHECKED_IN: { label: t("statusCheckedIn"), color: "bg-emerald-100 text-emerald-700", icon: <Check size={12} /> },
        CANCELLED: { label: t("statusCancelled"), color: "bg-gray-100 text-gray-500", icon: <XCircle size={12} /> },
        NO_SHOW: { label: t("statusNoShow"), color: "bg-red-100 text-red-600", icon: <Ban size={12} /> },
    };

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [tab, setTab] = useState<"book" | "list">("list");

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);
    const [selectedChildId, setSelectedChildId] = useState("");

    // Bookings state
    const [bookings, setBookings] = useState<BookingData[]>([]);

    // Confirm popup state
    const [confirmAction, setConfirmAction] = useState<{
        type: "checkin" | "cancel" | "noshow";
        bookingId: string;
        memberName: string;
    } | null>(null);

    const showMsg = (msg: string) => {
        setMessage(msg);
        // Only auto-dismiss success messages; errors stay visible
        if (msg.includes("สำเร็จ") || msg.includes("success")) {
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const loadBookings = async () => {
        const data = await getBookingsByEntry(entry.id);
        setBookings(JSON.parse(JSON.stringify(data)));
    };

    useEffect(() => {
        loadBookings();
    }, [entry.id]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 1) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            const results = await searchMembersForBooking(searchQuery);
            setSearchResults(results);
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleBook = async () => {
        if (!selectedMember) return;
        setLoading(true);
        const fd = new FormData();
        fd.set("classEntryId", entry.id);
        fd.set("userId", selectedMember.id);
        if (selectedChildId) fd.set("childId", selectedChildId);
        const result = await bookClassForMember(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("successBook"));
            setSelectedMember(null);
            setSelectedChildId("");
            setSearchQuery("");
            setSearchResults([]);
            await loadBookings();
            setTab("list");
        }
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;
        if (confirmAction.type === "checkin") {
            result = await checkInBooking(confirmAction.bookingId);
        } else if (confirmAction.type === "cancel") {
            result = await cancelBooking(confirmAction.bookingId);
        } else {
            result = await markNoShow(confirmAction.bookingId);
        }
        setLoading(false);
        const actionType = confirmAction.type;
        setConfirmAction(null);
        if (result.error) {
            showMsg(result.error);
        } else {
            const msgs: Record<string, string> = {
                checkin: `${t("successCheckin")}${result.coinsCharged ? ` ${t("coinsDeducted", { coins: result.coinsCharged })}` : ""}`,
                cancel: t("successCancel"),
                noshow: t("successNoShow"),
            };
            showMsg(msgs[actionType] || "Success");
            await loadBookings();
        }
    };

    const bookedCount = bookings.filter((b) => b.status === "BOOKED").length;
    const checkedInCount = bookings.filter((b) => b.status === "CHECKED_IN").length;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-[#d1cce7]/20 p-4 z-10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-[#3d405b] text-lg">{t("panelTitle")}</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-[#3d405b]/40" />
                        </button>
                    </div>
                    <div className="bg-[#81b29a]/10 rounded-lg p-3">
                        <p className="text-sm font-bold text-[#3d405b]">{entry.title}</p>
                        <p className="text-xs text-[#3d405b]/50 mt-0.5">
                            {DAY_LABELS[entry.dayOfWeek]} • {entry.startTime}-{entry.endTime}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-3 text-xs">
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                            <Clock size={11} /> {t("bookedCount", { count: bookedCount })}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Check size={11} /> {t("checkedInCount", { count: checkedInCount })}
                        </span>
                    </div>
                </div>

                <AlertMessage
                    type={(message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                    message={message}
                />

                {/* Tabs */}
                <div className="flex border-b border-[#d1cce7]/20">
                    <button
                        onClick={() => setTab("list")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "list"
                            ? "text-[#609279] border-b-2 border-[#609279]"
                            : "text-[#3d405b]/40 hover:text-[#3d405b]"
                            }`}
                    >
                        <Users size={14} className="inline mr-1.5" />
                        {t("tabList", { count: bookings.length })}
                    </button>
                    <button
                        onClick={() => setTab("book")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "book"
                            ? "text-[#609279] border-b-2 border-[#609279]"
                            : "text-[#3d405b]/40 hover:text-[#3d405b]"
                            }`}
                    >
                        <UserPlus size={14} className="inline mr-1.5" />
                        {t("tabBook")}
                    </button>
                </div>

                <div className="p-4">
                    {/* Book Tab */}
                    {tab === "book" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-[#3d405b]/60 mb-1 block">
                                    {t("searchLabel")}
                                </label>
                                <div className="relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t("searchPlaceholder")}
                                        className="w-full pl-9 pr-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                                    />
                                    {searching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-[#81b29a]/30 border-t-[#609279] rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {searchResults.length > 0 && !selectedMember && (
                                    <div className="mt-2 border border-[#d1cce7]/20 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {searchResults.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setSearchQuery(m.parentName);
                                                    setSearchResults([]);
                                                    if (m.children.length === 1) setSelectedChildId(m.children[0].id);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#81b29a]/5 transition-colors border-b border-[#d1cce7]/10 last:border-b-0"
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-[#3d405b]">{m.parentName}</p>
                                                    <p className="text-xs text-[#3d405b]/40">{m.phone}</p>
                                                </div>
                                                <span className="text-xs text-[#609279] font-medium flex items-center gap-0.5">
                                                    <Coins size={11} />
                                                    {m.totalCoins}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedMember && (
                                <div className="space-y-3">
                                    <div className="bg-[#f4f1de] rounded-xl p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-[#3d405b]">{selectedMember.parentName}</p>
                                                <p className="text-xs text-[#3d405b]/40">{selectedMember.phone}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedMember(null);
                                                    setSearchQuery("");
                                                    setSelectedChildId("");
                                                }}
                                                className="p-1 hover:bg-white/50 rounded"
                                            >
                                                <X size={14} className="text-[#3d405b]/40" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#609279] font-medium mt-1 flex items-center gap-1">
                                            <Coins size={11} />
                                            {t("coinsBalance", { coins: selectedMember.totalCoins })}
                                        </p>
                                    </div>

                                    {selectedMember.children.length > 0 ? (
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 mb-1 block">
                                                {t("childLabel")} <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                value={selectedChildId}
                                                onChange={(e) => setSelectedChildId(e.target.value)}
                                                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 bg-white ${
                                                    !selectedChildId ? "border-red-300" : "border-[#d1cce7]/30"
                                                }`}
                                            >
                                                <option value="">{t("childSelect")}</option>
                                                {selectedMember.children.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {!selectedChildId && (
                                                <p className="text-xs text-red-400 mt-1">{t("childRequired")}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 rounded-xl p-3">
                                            <p className="text-xs text-amber-600 font-medium">{t("noChildWarning")}</p>
                                            <p className="text-xs text-amber-500 mt-0.5">{t("noChildInstruction")}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleBook}
                                        disabled={loading || !selectedChildId}
                                        className="w-full py-3 bg-[#609279] text-white rounded-xl font-medium text-sm hover:bg-[#4e7a64] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={16} />
                                        {t("bookBtn")}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bookings List Tab */}
                    {tab === "list" && (
                        <div className="space-y-2">
                            {bookings.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={32} className="mx-auto text-[#3d405b]/15 mb-2" />
                                    <p className="text-sm text-[#3d405b]/30">{t("emptyBookings")}</p>
                                </div>
                            ) : (
                                bookings.map((b) => {
                                    const statusInfo = STATUS_LABELS[b.status] || STATUS_LABELS.BOOKED;
                                    return (
                                        <div key={b.id} className="border border-[#d1cce7]/20 rounded-xl p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#3d405b]">{b.user.parentName}</p>
                                                    {b.child && (
                                                        <p className="text-xs text-[#3d405b]/40">{t("childPrefix")}{b.child.name}</p>
                                                    )}
                                                    <p className="text-[10px] text-[#3d405b]/30 mt-0.5">
                                                        {b.user.phone} • {t("bookedBy", { name: b.bookedBy.name })}
                                                    </p>
                                                </div>
                                                <span className={`${statusInfo.color} px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {b.status === "CHECKED_IN" && b.coinsCharged > 0 && (
                                                <p className="text-xs text-emerald-600 flex items-center gap-1 mb-2">
                                                    <Coins size={11} />
                                                    {t("coinsDeducted", { coins: b.coinsCharged })}
                                                </p>
                                            )}

                                            {b.status === "BOOKED" && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => setConfirmAction({ type: "checkin", bookingId: b.id, memberName: b.child ? b.child.name : b.user.parentName })}
                                                        disabled={loading}
                                                        className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1"
                                                    >
                                                        <Check size={12} /> {t("checkInBtn")}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: "cancel", bookingId: b.id, memberName: b.child ? b.child.name : b.user.parentName })}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50"
                                                    >
                                                        {t("cancelBtn")}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: "noshow", bookingId: b.id, memberName: b.child ? b.child.name : b.user.parentName })}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 bg-red-50 text-red-400 rounded-lg text-xs hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        {t("noShowBtn")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Popup */}
            {confirmAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <h4 className="text-lg font-bold text-[#3d405b] mb-2">
                            {confirmAction.type === "checkin" && t("confirmCheckinTitle")}
                            {confirmAction.type === "cancel" && t("confirmCancelTitle")}
                            {confirmAction.type === "noshow" && t("confirmNoShowTitle")}
                        </h4>
                        <p className="text-sm text-[#3d405b]/60 mb-1">
                            <strong>{confirmAction.memberName}</strong>
                        </p>
                        <p className="text-sm text-[#3d405b]/60 mb-4">
                            {entry.title} — {DAY_LABELS[entry.dayOfWeek]} {entry.startTime}-{entry.endTime}
                        </p>
                        {confirmAction.type === "checkin" && (
                            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-4 flex items-center gap-1">
                                <Coins size={12} />
                                {t("confirmHintCheckin")}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 ${confirmAction.type === "checkin"
                                        ? "bg-emerald-500 hover:bg-emerald-600"
                                        : confirmAction.type === "noshow"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-gray-500 hover:bg-gray-600"
                                    }`}
                            >
                                {loading ? t("loadingBtn") : t("confirmBtn")}
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm hover:bg-gray-200"
                            >
                                {t("cancelConfirmBtn")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
