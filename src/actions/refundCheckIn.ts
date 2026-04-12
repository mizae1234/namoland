"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function cancelAndRefundCheckIn(recordId: string, isManual: boolean) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    try {
        if (!isManual) {
            // Case 1: Native ClassBooking Check-In
            const booking = await prisma.classBooking.findUnique({
                where: { id: recordId },
            });
            if (!booking) return { error: "ไม่พบข้อมูลการจอง" };
            if (booking.status !== "CHECKED_IN") return { error: "รายการนีไม่ได้อยู่ในสถานะเช็คอินแล้ว ไม่สามารถยกเลิกได้" };
            if (!booking.checkedInAt) return { error: "ไม่มีประวัติเวลาเช็คอินให้ใช้อ้างอิง" };

            // Find CoinTransactions associated with this Check-in
            // We match by userId, createdAt (must exactly match checkedInAt), and type CLASS_FEE
            const candidateTxs = await prisma.coinTransaction.findMany({
                where: {
                    package: { userId: booking.userId },
                    type: "CLASS_FEE",
                    createdAt: booking.checkedInAt,
                    description: { startsWith: "Check-in: " }
                },
                orderBy: { id: "asc" }
            });

            // We only want to refund exactly booking.coinsCharged
            let targetRefund = booking.coinsCharged;
            const txsToReverse = [];
            
            for (const tx of candidateTxs) {
                if (targetRefund <= 0) break;
                txsToReverse.push(tx);
                targetRefund -= tx.coinsUsed;
            }
            
            const ops = [];
            // 1. Restore package coins
            for (const tx of txsToReverse) {
                ops.push(
                    prisma.coinPackage.update({
                        where: { id: tx.packageId },
                        data: { remainingCoins: { increment: tx.coinsUsed } }
                    })
                );
                // 2. Erase the mistakenly keyed transaction
                ops.push(
                    prisma.coinTransaction.delete({
                        where: { id: tx.id }
                    })
                );
            }
            
            // 3. Update the booking status to CANCELLED and wipe cost
            ops.push(
                prisma.classBooking.update({
                    where: { id: recordId },
                    data: {
                        status: "CANCELLED",
                        coinsCharged: 0,
                        checkedInAt: null,
                    }
                })
            );

            await prisma.$transaction(ops);

        } else {
            // Case 2: Manual Drop-in CoinTransaction
            const targetTx = await prisma.coinTransaction.findUnique({
                where: { id: recordId },
                include: { package: true }
            });
            if (!targetTx) return { error: "ไม่พบข้อมูลรายการ" };

            // A single manual check-in might have been split across multiple packages (FIFO).
            // We find all siblings that share the exact createdAt and description
            const siblingTxs = await prisma.coinTransaction.findMany({
                where: {
                    package: { userId: targetTx.package.userId },
                    type: "CLASS_FEE",
                    createdAt: targetTx.createdAt,
                    description: targetTx.description
                }
            });

            const ops = [];
            for (const tx of siblingTxs) {
                ops.push(
                    prisma.coinPackage.update({
                        where: { id: tx.packageId },
                        data: { remainingCoins: { increment: tx.coinsUsed } }
                    })
                );
                ops.push(
                    prisma.coinTransaction.delete({
                        where: { id: tx.id }
                    })
                );
            }

            await prisma.$transaction(ops);
        }

        revalidatePath("/members");
        revalidatePath("/classes");
        revalidatePath("/coins");
        revalidatePath("/reports");
        
        return { success: true };
    } catch (err) {
        console.error("Cancel and Refund check-in error:", err);
        return { error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : "Unknown"}` };
    }
}
