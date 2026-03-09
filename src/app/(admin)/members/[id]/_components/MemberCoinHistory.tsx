"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

type Transaction = {
    id: string;
    type: string;
    coinsUsed: number;
    className: string | null;
    description: string | null;
    createdAt: string | Date;
};

type Package = {
    id: string;
    packageType: string;
    totalCoins: number;
    remainingCoins: number;
    pricePaid: number | string;
    bonusAmount: number | string;
    isExpired: boolean;
    isExtended: boolean;
    expiresAt: string | Date | null;
    note: string | null;
    paymentMethod: string | null;
    createdAt: string | Date;
    transactions: Transaction[];
};

type BorrowRecord = {
    id: string;
    code: string;
    status: string;
    rentalCoins: number;
    depositCoins: number;
    lateFeeCoins: number;
    damageFeeCoins: number;
    depositReturned: boolean;
    depositForfeited: boolean;
    borrowDate: string | Date;
    returnDate: string | Date | null;
    createdAt: string | Date;
    items: Array<{ book: { title: string } }>;
};

type ExpiryLogEntry = {
    id: string;
    previousDate: string | Date | null;
    newDate: string | Date;
    note: string | null;
    performedBy: string;
    createdAt: string | Date;
};

// Unified timeline event
type TimelineEvent = {
    date: Date;
    type: "IN" | "OUT" | "REFUND" | "ADJUST";
    label: string;
    detail: string | null;
    coins: number;
    source: string;
};

const TX_TYPE_MAP: Record<string, { label: string; type: TimelineEvent["type"] }> = {
    CLASS_FEE: { label: "ค่าเรียน", type: "OUT" },
    BOOK_RENTAL: { label: "ค่ายืมหนังสือ", type: "OUT" },
    BOOK_DEPOSIT: { label: "มัดจำหนังสือ", type: "OUT" },
    BOOK_DEPOSIT_RETURN: { label: "คืนมัดจำ", type: "REFUND" },
    BOOK_LATE_FEE: { label: "ค่าปรับช้า", type: "OUT" },
    BOOK_DAMAGE_FEE: { label: "ค่าปรับเสียหาย", type: "OUT" },
    DEPOSIT_FORFEIT: { label: "ยึดมัดจำ", type: "OUT" },
    EXPIRED: { label: "หมดอายุ", type: "OUT" },
    ADJUSTMENT: { label: "ปรับเหรียญ", type: "ADJUST" },
    EXTENSION: { label: "ขยายเวลา", type: "ADJUST" },
};

const PAYMENT_MAP: Record<string, string> = {
    CASH: "เงินสด",
    TRANSFER: "เงินโอน",
};

type FilterType = "ALL" | "IN" | "OUT";

export default function MemberCoinHistory({
    packages,
    borrowRecords,
    expiryLogs,
    actualBalance,
}: {
    packages: Package[];
    borrowRecords?: BorrowRecord[];
    expiryLogs?: ExpiryLogEntry[];
    actualBalance: number;
}) {
    const [filterType, setFilterType] = useState<FilterType>("ALL");
    const [expanded, setExpanded] = useState(true);

    // Build unified timeline
    const events: TimelineEvent[] = [];

    // 1. Package purchases (coins IN)
    for (const pkg of packages) {
        events.push({
            date: new Date(pkg.createdAt),
            type: "IN",
            label: `ซื้อแพ็คเกจ ${pkg.packageType.replace(/_/g, " ")}`,
            detail: [
                `${Number(pkg.pricePaid).toLocaleString()} บาท`,
                pkg.paymentMethod ? PAYMENT_MAP[pkg.paymentMethod] || pkg.paymentMethod : null,
                pkg.note,
            ].filter(Boolean).join(" · "),
            coins: parseInt(pkg.packageType) || pkg.totalCoins,
            source: "purchase",
        });

        // Package transactions
        for (const tx of pkg.transactions) {
            // Special handling for ADJUSTMENT: negative coinsUsed means coins were ADDED
            if (tx.type === "ADJUSTMENT" && tx.coinsUsed < 0) {
                events.push({
                    date: new Date(tx.createdAt),
                    type: "IN",
                    label: "ปรับเพิ่มเหรียญ",
                    detail: tx.description?.replace("[เพิ่ม] ", "") || tx.className || null,
                    coins: Math.abs(tx.coinsUsed),
                    source: "transaction",
                });
            } else {
                const config = TX_TYPE_MAP[tx.type] || { label: tx.type, type: "OUT" as const };
                events.push({
                    date: new Date(tx.createdAt),
                    type: tx.type === "ADJUSTMENT" ? "OUT" : config.type,
                    label: tx.type === "ADJUSTMENT" ? "ปรับลดเหรียญ" : config.label,
                    detail: tx.className || tx.description || null,
                    coins: tx.coinsUsed,
                    source: "transaction",
                });
            }
        }

        // Expired package
        if (pkg.isExpired && pkg.remainingCoins === 0) {
            const expiryDate = pkg.expiresAt ? new Date(pkg.expiresAt) : new Date(pkg.createdAt);
            // Only add if no EXPIRED transaction already exists
            const hasExpiredTx = pkg.transactions.some(t => t.type === "EXPIRED");
            if (!hasExpiredTx && pkg.expiresAt) {
                events.push({
                    date: expiryDate,
                    type: "OUT",
                    label: "หมดอายุ",
                    detail: `แพ็คเกจ ${pkg.packageType.replace(/_/g, " ")}`,
                    coins: 0,
                    source: "expiry",
                });
            }
        }
    }

    // 2. Expiry extension logs
    if (expiryLogs) {
        for (const log of expiryLogs) {
            const prev = log.previousDate
                ? format(new Date(log.previousDate), "d MMM yy", { locale: th })
                : "ไม่มี";
            const next = format(new Date(log.newDate), "d MMM yy", { locale: th });
            events.push({
                date: new Date(log.createdAt),
                type: "ADJUST",
                label: "ขยายเวลาหมดอายุ",
                detail: [`${prev} → ${next}`, log.note].filter(Boolean).join(" · "),
                coins: 0,
                source: "expiry_extend",
            });
        }
    }

    // Collect all CoinTransaction descriptions for dedup check
    const allTxDescriptions = new Set<string>();
    for (const pkg of packages) {
        for (const tx of pkg.transactions) {
            if (tx.description) allTxDescriptions.add(tx.description);
        }
    }

    // 3. Borrow-related events (from BorrowRecords — only for reservations that don't have CoinTransaction entries)
    if (borrowRecords) {
        for (const br of borrowRecords) {
            const bookNames = br.items.map(i => i.book.title).join(", ");

            // Rental coin deduction — only for active reservations (admin borrows already have CoinTransaction)
            if (br.rentalCoins > 0 && br.status === "RESERVED") {
                events.push({
                    date: new Date(br.createdAt),
                    type: "OUT",
                    label: "ค่ายืมหนังสือ (จอง)",
                    detail: bookNames,
                    coins: br.rentalCoins,
                    source: `borrow-rental-${br.id}`,
                });
            }

            // Deposit deduction — only if NO matching CoinTransaction exists (avoids duplication)
            if (br.depositCoins > 0 && br.status !== "RESERVED") {
                const hasDepositTx = allTxDescriptions.has(`เงินมัดจำหนังสือ (${br.code})`);
                if (!hasDepositTx) {
                    events.push({
                        date: new Date(br.borrowDate),
                        type: "OUT",
                        label: "มัดจำหนังสือ",
                        detail: `เงินมัดจำหนังสือ (${br.code})`,
                        coins: br.depositCoins,
                        source: `borrow-deposit-${br.id}`,
                    });
                }
            }

            // Deposit returned
            if (br.depositReturned && br.returnDate) {
                events.push({
                    date: new Date(br.returnDate),
                    type: "REFUND",
                    label: "คืนมัดจำ",
                    detail: bookNames,
                    coins: br.depositCoins,
                    source: `borrow-refund-${br.id}`,
                });
            }

            // Late fee
            if (br.lateFeeCoins > 0 && br.returnDate) {
                events.push({
                    date: new Date(br.returnDate),
                    type: "OUT",
                    label: "ค่าปรับล่าช้า",
                    detail: bookNames,
                    coins: br.lateFeeCoins,
                    source: `borrow-late-${br.id}`,
                });
            }

            // Deposit forfeited
            if (br.depositForfeited) {
                events.push({
                    date: new Date(br.returnDate || br.borrowDate),
                    type: "OUT",
                    label: "ยึดมัดจำ",
                    detail: bookNames,
                    coins: br.depositCoins,
                    source: `borrow-forfeit-${br.id}`,
                });
            }
        }
    }

    // Deduplicate: if a CoinTransaction already covers a borrow event, remove the borrow-generated one
    // Simple approach: remove borrow-rental and borrow-deposit events if matching CoinTransaction exists
    const txDates = new Set(
        events
            .filter(e => e.source === "transaction")
            .map(e => `${e.label}-${e.date.getTime()}`)
    );
    const dedupedEvents = events.filter(e => {
        if (e.source.startsWith("borrow-")) {
            const key = `${e.label}-${e.date.getTime()}`;
            return !txDates.has(key);
        }
        return true;
    });

    // Sort by date descending (newest first)
    dedupedEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply filter
    const filteredEvents = dedupedEvents.filter(e => {
        if (filterType === "ALL") return true;
        if (filterType === "IN") return e.type === "IN" || e.type === "REFUND";
        return e.type === "OUT";
    });

    // Compute summary
    const totalIn = dedupedEvents.filter(e => e.type === "IN" || e.type === "REFUND").reduce((s, e) => s + e.coins, 0);
    const totalOut = dedupedEvents.filter(e => e.type === "OUT").reduce((s, e) => s + e.coins, 0);

    if (dedupedEvents.length === 0) {
        return (
            <div className="p-6 text-center text-[#3d405b]/40 text-sm">
                ยังไม่มีประวัติเหรียญ
            </div>
        );
    }

    const typeConfig = {
        IN: { icon: ArrowUpCircle, color: "text-emerald-600", bg: "bg-emerald-50", sign: "+" },
        OUT: { icon: ArrowDownCircle, color: "text-red-500", bg: "bg-red-50", sign: "-" },
        REFUND: { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50", sign: "+" },
        ADJUST: { icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50", sign: "~" },
    };

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-[#d1cce7]/20">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600/60 mb-1">เข้า (ซื้อ/คืน)</p>
                    <p className="text-lg font-bold text-emerald-600">+{totalIn}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-500/60 mb-1">ออก (ใช้/หัก)</p>
                    <p className="text-lg font-bold text-red-500">-{totalOut}</p>
                </div>
                <div className="bg-[#f4f1de] rounded-xl p-3 text-center">
                    <p className="text-xs text-[#3d405b]/40 mb-1">สุทธิ</p>
                    <p className={`text-lg font-bold ${actualBalance >= 0 ? "text-[#609279]" : "text-red-500"}`}>
                        {actualBalance}
                    </p>
                </div>
            </div>

            {/* Filter + Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1cce7]/10">
                <div className="flex gap-1.5">
                    {([["ALL", "ทั้งหมด"], ["IN", "เข้า"], ["OUT", "ออก"]] as [FilterType, string][]).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilterType(val)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${filterType === val
                                ? "bg-[#609279] text-white"
                                : "bg-[#f4f1de]/50 text-[#3d405b]/40 hover:text-[#3d405b]/60"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-[#3d405b]/40 flex items-center gap-1 hover:text-[#3d405b]/60"
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {filteredEvents.length} รายการ
                </button>
            </div>

            {/* Timeline */}
            {expanded && (
                <div className="divide-y divide-[#d1cce7]/10">
                    {filteredEvents.map((event, i) => {
                        const config = typeConfig[event.type];
                        const Icon = config.icon;
                        return (
                            <div key={`${event.source}-${i}`} className="flex items-start gap-3 px-4 py-3 hover:bg-[#f4f1de]/20 transition-colors">
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                    <Icon size={14} className={config.color} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-[#3d405b]">{event.label}</p>
                                            {event.detail && (
                                                <p className="text-xs text-[#3d405b]/40 mt-0.5 truncate">{event.detail}</p>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold shrink-0 ${event.type === "IN" || event.type === "REFUND"
                                            ? "text-emerald-600"
                                            : event.type === "OUT"
                                                ? "text-red-500"
                                                : "text-amber-500"
                                            }`}>
                                            {config.sign}{event.coins}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[#3d405b]/30 mt-1">
                                        {format(event.date, "d MMM yyyy · HH:mm", { locale: th })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
