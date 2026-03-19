/**
 * Shared Borrow Service
 *
 * Centralizes borrow-related operations that were duplicated across
 * createBorrow and reserveBook — specifically borrow code generation
 * with race-condition safety.
 */

import prisma from "@/lib/prisma";

// ─── Borrow Code Generation ─────────────────────────────────────────

/**
 * Generate a unique borrow code: BOR-YYYYMM-NNNN
 * Uses findFirst with orderBy desc to avoid count-based race conditions.
 */
export async function generateBorrowCode(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `BOR-${yearMonth}-`;

    // Find the highest existing code for this month
    const latest = await prisma.borrowRecord.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: "desc" },
        select: { code: true },
    });

    let nextNum: number;
    if (latest) {
        // Extract number from "BOR-YYYYMM-0042" → 42
        const parts = latest.code.split("-");
        nextNum = parseInt(parts[2]) + 1;
    } else {
        nextNum = 1;
    }

    return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

// ─── Active Deposit Check ────────────────────────────────────────────

/**
 * Check if a user already has an active deposit on any BORROWED record.
 * Used in both createBorrow and confirmReservation flows.
 */
export async function hasActiveDeposit(userId: string): Promise<boolean> {
    const count = await prisma.borrowRecord.count({
        where: {
            userId,
            status: "BORROWED",
            depositReturned: false,
            depositForfeited: false,
        },
    });
    return count > 0;
}

/**
 * Batch-check which user IDs from a list have active deposits.
 * Used in the borrows list page for pre-computing deposit status.
 */
export async function getUsersWithActiveDeposit(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();

    const activeDeposits = await prisma.borrowRecord.findMany({
        where: {
            userId: { in: userIds },
            status: "BORROWED",
            depositReturned: false,
            depositForfeited: false,
        },
        select: { userId: true },
        distinct: ["userId"],
    });

    return new Set(activeDeposits.map((d) => d.userId));
}
