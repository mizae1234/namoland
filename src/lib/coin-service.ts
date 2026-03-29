/**
 * Shared Coin Service
 *
 * Centralizes all coin-related operations that were duplicated across
 * borrow.ts, coin.ts, classBooking.ts — FIFO deduction, expiry clock,
 * and coinExpiryOverride sync.
 */

import prisma from "@/lib/prisma";
import type { CoinPackage, CoinTransactionType } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────

export type CoinDeduction = {
    packageId: string;
    amount: number;
    pkg: CoinPackage;
};

export type FIFOResult = {
    packages: CoinPackage[];
    deductions: CoinDeduction[];
    totalAvailable: number;
};

// ─── FIFO Coin Deduction ─────────────────────────────────────────────

/**
 * Fetch active packages and plan FIFO deduction (oldest first).
 * Does NOT execute — returns the plan for use in a $transaction.
 */
export async function prepareFIFODeduction(
    userId: string,
    coinsNeeded: number,
): Promise<FIFOResult> {
    const packages = await prisma.coinPackage.findMany({
        where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
        orderBy: { purchaseDate: "asc" },
    });

    const totalAvailable = packages.reduce((s, p) => s + p.remainingCoins, 0);
    const deductions: CoinDeduction[] = [];

    let remaining = coinsNeeded;
    for (const pkg of packages) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, pkg.remainingCoins);
        deductions.push({ packageId: pkg.id, amount: deduct, pkg });
        remaining -= deduct;
    }

    return { packages, deductions, totalAvailable };
}

// ─── Build Prisma Operations ─────────────────────────────────────────

/**
 * Build package update operations from a FIFO deduction plan.
 * Includes expiry clock start for first-use packages.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPackageDeductOps(deductions: CoinDeduction[], now: Date): any[] {
    return deductions.map((d) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {
            remainingCoins: d.pkg.remainingCoins - d.amount,
        };

        // Start expiry clock on first use
        if (!d.pkg.firstUsedAt) {
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            data.firstUsedAt = now;
            data.expiresAt = expiresAt;
        }

        return prisma.coinPackage.update({
            where: { id: d.packageId },
            data,
        });
    });
}

/**
 * Build CoinTransaction records for a FIFO deduction, properly mapping
 * each deduction to its source package (fixes misattribution bug).
 */
export function buildTransactionOps(
    deductions: CoinDeduction[],
    type: CoinTransactionType,
    processedById: string,
    opts: {
        className?: string;
        description?: string;
    } = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
    return deductions.map((d) =>
        prisma.coinTransaction.create({
            data: {
                packageId: d.packageId,
                type,
                coinsUsed: d.amount,
                className: opts.className || null,
                description: opts.description || null,
                processedById,
            },
        }),
    );
}

// ─── Expiry Override Sync ────────────────────────────────────────────

/**
 * Update coinExpiryOverride on the user if a package just started
 * its expiry clock and the new expiry is later than the current override.
 */
export async function syncCoinExpiryOverride(
    userId: string,
    deductions: CoinDeduction[],
    now: Date,
): Promise<void> {
    const hasNewExpiry = deductions.some((d) => !d.pkg.firstUsedAt);
    if (!hasNewExpiry) return;

    const newExpiresAt = new Date(now);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { coinExpiryOverride: true },
    });

    if (!user?.coinExpiryOverride || newExpiresAt > new Date(user.coinExpiryOverride)) {
        await prisma.user.update({
            where: { id: userId },
            data: { coinExpiryOverride: newExpiresAt },
        });
    }
}
