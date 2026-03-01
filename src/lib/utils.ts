import { LATE_FEE_TIERS } from "@/lib/constants";

// Pure utility function — NOT a server action
export function calculateLateFee(dueDate: Date, returnDate: Date): { lateDays: number; feeCoins: number; forfeitDeposit: boolean } {
    const diffMs = returnDate.getTime() - dueDate.getTime();
    const lateDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (lateDays <= LATE_FEE_TIERS.GRACE_DAYS) return { lateDays, feeCoins: 0, forfeitDeposit: false };
    if (lateDays <= LATE_FEE_TIERS.TIER1_DAYS) return { lateDays, feeCoins: LATE_FEE_TIERS.TIER1_FEE, forfeitDeposit: false };
    if (lateDays <= LATE_FEE_TIERS.TIER2_DAYS) return { lateDays, feeCoins: LATE_FEE_TIERS.TIER2_FEE, forfeitDeposit: false };
    return { lateDays, feeCoins: 0, forfeitDeposit: true }; // Forfeit deposit
}

