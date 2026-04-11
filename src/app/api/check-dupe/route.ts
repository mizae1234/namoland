import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const txs = await prisma.coinTransaction.findMany({
            where: { className: { contains: "Namo Little Artist" } }
        });
        
        const info = await Promise.all(txs.map(async tx => {
            // Find booking checked in at the exact same time
            const booking = await prisma.classBooking.findFirst({
                where: { checkedInAt: tx.createdAt },
                include: { child: true }
            });
            return {
                id: tx.id,
                coinsUsed: tx.coinsUsed,
                date: tx.createdAt.toISOString(),
                childName: booking?.child?.name,
                status: booking?.status
            };
        }));
        
        return NextResponse.json({ info });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
