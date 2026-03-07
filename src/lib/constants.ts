// ===== Business Configuration =====
// Centralized constants for easy maintenance

// Borrow settings
export const BORROW_DEPOSIT_COINS = 5;
export const BORROW_RENTAL_COINS = 1;
export const BORROW_DURATION_DAYS = 14;
export const DAMAGE_FEE_PER_BOOK = 1;

// Late fee tiers
export const LATE_FEE_TIERS = {
    GRACE_DAYS: 5,      // ≤5 days = no fee
    TIER1_DAYS: 15,     // 6-15 days = 1 coin
    TIER1_FEE: 1,
    TIER2_DAYS: 30,     // 16-30 days = 2 coins
    TIER2_FEE: 2,
    // >30 days = forfeit deposit
} as const;

// Coin package defaults
export const DEFAULT_EXPIRY_EXTEND_DAYS = 30;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// ===== Status & Type Maps =====

export const BORROW_STATUS_MAP: Record<string, { label: string; className: string }> = {
    RESERVED: { label: "รอรับ", className: "bg-violet-100 text-violet-700" },
    BORROWED: { label: "กำลังยืม", className: "bg-blue-100 text-blue-700" },
    RETURNED: { label: "คืนแล้ว", className: "bg-emerald-100 text-emerald-700" },
    OVERDUE: { label: "เกินกำหนด", className: "bg-red-100 text-red-700" },
    FORFEITED: { label: "ยึดมัดจำ", className: "bg-slate-200 text-slate-700" },
    CANCELLED: { label: "ยกเลิก", className: "bg-orange-100 text-orange-700" },
};

export const COIN_TX_TYPE_MAP: Record<string, string> = {
    CLASS_FEE: "ค่าเรียน",
    BOOK_RENTAL: "ค่ายืมหนังสือ",
    BOOK_DEPOSIT: "เงินมัดจำ",
    BOOK_DEPOSIT_RETURN: "คืนมัดจำ",
    BOOK_LATE_FEE: "ค่าปรับช้า",
    BOOK_DAMAGE_FEE: "ค่าปรับเสียหาย",
    DEPOSIT_FORFEIT: "ยึดมัดจำ",
    EXPIRED: "หมดอายุ",
    ADJUSTMENT: "ปรับเหรียญ",
    EXTENSION: "ขยายเวลา",
};
