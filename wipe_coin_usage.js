const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("เริ่มกระบวนการล้างประวัติการใช้เหรียญทั้งหมด...");

    try {
        await prisma.$transaction(async (tx) => {
            // 1. ดึงข้อมูลแพ็กเกจทั้งหมดเพื่อซิงค์ยอดเหรียญกลับไปให้เต็มเท่ากับที่ซื้อมา
            console.log("1. กำลังกู้คืนยอดเหรียญคงเหลือในทุกแพ็กเกจ...");
            const packages = await tx.coinPackage.findMany();
            let restoredCount = 0;
            
            for (const pkg of packages) {
                if (pkg.remainingCoins !== pkg.totalCoins) {
                    await tx.coinPackage.update({
                        where: { id: pkg.id },
                        data: { remainingCoins: pkg.totalCoins }
                    });
                    restoredCount++;
                }
            }
            console.log(`   - คืนเหรียญเรียบร้อยแล้วจำนวน ${restoredCount} แพ็กเกจ`);

            // 2. ยกเลิกการ Check-in เข้าคลาสทั้งหมด
            console.log("2. ซิงค์ตารางเรียน: เคลียร์สถานะ Check-in ทั้งหมดกลับไปเป็นยังไม่เรียน...");
            const bookingUpdate = await tx.classBooking.updateMany({
                where: { status: "CHECKED_IN" },
                data: {
                    status: "BOOKED",
                    coinsCharged: 0,
                    checkedInAt: null,
                }
            });
            console.log(`   - เปลี่ยนสถานะการจองไปแล้ว ${bookingUpdate.count} รายการ`);

            // 3. ลบ Transaction ที่มีการ "ตัดเหรียญออก" เท่านั้น (coinsUsed > 0)
            console.log("3. กำลังล้างประวัติการตัดเหรียญ (CoinTransaction)...");
            const deletedTxs = await tx.coinTransaction.deleteMany({
                where: {
                    coinsUsed: { gt: 0 } // ลบเฉพาะที่มีการหักเหรียญ
                }
            });
            console.log(`   - ลบประวัติการใช้เหรียญจำนวน ${deletedTxs.count} รายการ`);
        });

        console.log("✅ ล้างประวัติการใช้เหรียญสำเร็จ! ข้อมูลการซื้อแพ็กเกจยังอยู่ครบถ้วน");

    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาด:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
