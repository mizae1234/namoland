import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding demo data...");

    // ========== 1. Admin Users ==========
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const superAdmin = await prisma.adminUser.upsert({
        where: { email: "admin@namoland.com" },
        update: { password: hashedPassword },
        create: {
            name: "Namoland Admin",
            email: "admin@namoland.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
        },
    });

    const staffAdmin = await prisma.adminUser.upsert({
        where: { email: "staff@namoland.com" },
        update: { password: hashedPassword },
        create: {
            name: "พี่แนน",
            email: "staff@namoland.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log("✅ Admin users created");

    // ========== 2. Members (Parents + Children) ==========
    const members = [
        {
            parentName: "คุณสมศรี วงศ์สุข",
            phone: "081-234-5678",
            qrCode: "NML-A1B2C3D4E5F6",
            children: [
                { name: "น้องมะลิ", birthDate: new Date("2020-03-15") },
                { name: "น้องมะม่วง", birthDate: new Date("2022-08-22") },
            ],
        },
        {
            parentName: "คุณวิชัย รักเรียน",
            phone: "089-876-5432",
            qrCode: "NML-B2C3D4E5F6A7",
            children: [
                { name: "น้องปลาวาฬ", birthDate: new Date("2019-11-05") },
            ],
        },
        {
            parentName: "คุณนภา แสงดาว",
            phone: "092-111-2222",
            qrCode: "NML-C3D4E5F6A7B8",
            children: [
                { name: "น้องดาว", birthDate: new Date("2021-01-20") },
                { name: "น้องเดือน", birthDate: new Date("2023-06-10") },
            ],
        },
        {
            parentName: "คุณประภาส ใจดี",
            phone: "085-333-4444",
            qrCode: "NML-D4E5F6A7B8C9",
            children: [
                { name: "น้องก้อง", birthDate: new Date("2020-09-12") },
            ],
        },
        {
            parentName: "คุณพิมพ์ลดา สายน้ำ",
            phone: "063-555-6666",
            qrCode: "NML-E5F6A7B8C9D0",
            children: [
                { name: "น้องปลื้ม", birthDate: new Date("2021-04-30") },
                { name: "น้องปริม", birthDate: new Date("2023-02-14") },
                { name: "น้องปอนด์", birthDate: new Date("2024-12-01") },
            ],
        },
    ];

    const createdMembers = [];
    for (const m of members) {
        // Default password = last 4 digits of phone
        const digits = m.phone.replace(/\D/g, "");
        const defaultPw = digits.slice(-4);
        const hashedPw = await bcrypt.hash(defaultPw, 10);

        const user = await prisma.user.upsert({
            where: { phone: m.phone },
            update: { password: hashedPw },
            create: {
                parentName: m.parentName,
                phone: m.phone,
                password: hashedPw,
                qrCode: m.qrCode,
                children: {
                    create: m.children,
                },
            },
        });
        createdMembers.push(user);
    }
    console.log(`✅ ${createdMembers.length} members created`);

    // ========== 3. Books ==========
    const books = [
        { title: "ลูกหมูสามตัว", category: "นิทานคลาสสิก", ageRange: "3-6 ปี", qrCode: "BOOK-A1B2C3D4", youtubeUrl: "https://www.youtube.com/watch?v=UKx9ks6ASQE" },
        { title: "แมวเหมียวกับดวงจันทร์", category: "นิทานก่อนนอน", ageRange: "2-5 ปี", qrCode: "BOOK-B2C3D4E5", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { title: "หนูน้อยหมวกแดง", category: "นิทานคลาสสิก", ageRange: "3-6 ปี", qrCode: "BOOK-C3D4E5F6", youtubeUrl: "https://www.youtube.com/watch?v=Jn09UdSb3aA" },
        { title: "ช้างน้อยอยากบิน", category: "นิทานจินตนาการ", ageRange: "4-7 ปี", qrCode: "BOOK-D4E5F6A7", youtubeUrl: null },
        { title: "สัตว์โลกน่ารู้", category: "วิทยาศาสตร์", ageRange: "5-8 ปี", qrCode: "BOOK-E5F6A7B8", youtubeUrl: "https://www.youtube.com/watch?v=2MKMsmoQY7s" },
        { title: "เรียนรู้ตัวเลข 1-10", category: "คณิตศาสตร์", ageRange: "3-5 ปี", qrCode: "BOOK-F6A7B8C9", youtubeUrl: null },
        { title: "ดอกไม้หลากสี", category: "ธรรมชาติ", ageRange: "2-4 ปี", qrCode: "BOOK-G7B8C9D0", youtubeUrl: "https://www.youtube.com/watch?v=H_OhMdOnw68" },
        { title: "ผจญภัยในป่าลึก", category: "นิทานผจญภัย", ageRange: "5-8 ปี", qrCode: "BOOK-H8C9D0E1", youtubeUrl: null },
        { title: "กระต่ายกับเต่า", category: "นิทานคลาสสิก", ageRange: "3-6 ปี", qrCode: "BOOK-I9D0E1F2", youtubeUrl: "https://www.youtube.com/watch?v=UKx9ks6ASQE" },
        { title: "จักรวาลของหนู", category: "วิทยาศาสตร์", ageRange: "6-9 ปี", qrCode: "BOOK-J0E1F2G3", youtubeUrl: "https://www.youtube.com/watch?v=2MKMsmoQY7s" },
        { title: "วันพิเศษของพี่หมี", category: "นิทานอารมณ์", ageRange: "3-5 ปี", qrCode: "BOOK-K1F2G3H4", youtubeUrl: null },
        { title: "Dinosaur Adventure", category: "English", ageRange: "4-7 ปี", qrCode: "BOOK-L2G3H4I5", youtubeUrl: "https://www.youtube.com/watch?v=Jn09UdSb3aA" },
    ];

    const createdBooks = [];
    for (const b of books) {
        const book = await prisma.book.upsert({
            where: { qrCode: b.qrCode },
            update: {},
            create: { ...b, isAvailable: true },
        });
        createdBooks.push(book);
    }
    console.log(`✅ ${createdBooks.length} books created`);

    // ========== 4. Coin Packages & Transactions ==========
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Member 0: คุณสมศรี — 20 เหรียญ, ใช้ไป 8, เหลือ 12
    const pkg1 = await prisma.coinPackage.create({
        data: {
            userId: createdMembers[0].id,
            packageType: "20_COINS",
            totalCoins: 20,
            remainingCoins: 12,
            pricePaid: 3700,
            bonusAmount: 300,
            firstUsedAt: oneMonthAgo,
            expiresAt: tenDaysFromNow,
        },
    });

    // Transactions for pkg1
    await prisma.coinTransaction.createMany({
        data: [
            { packageId: pkg1.id, type: "CLASS_FEE", coinsUsed: 1, className: "Free Play (1 ชม.)", classHours: 1, processedById: staffAdmin.id, createdAt: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000) },
            { packageId: pkg1.id, type: "CLASS_FEE", coinsUsed: 1, className: "Little Explorers (1.5 ชม.)", classHours: 1.5, processedById: staffAdmin.id, createdAt: new Date(oneMonthAgo.getTime() + 5 * 24 * 60 * 60 * 1000) },
            { packageId: pkg1.id, type: "BOOK_DEPOSIT", coinsUsed: 5, description: "เงินมัดจำหนังสือ (BOR-202602-0001)", processedById: staffAdmin.id, createdAt: new Date(oneMonthAgo.getTime() + 10 * 24 * 60 * 60 * 1000) },
            { packageId: pkg1.id, type: "BOOK_RENTAL", coinsUsed: 1, description: "ค่ายืมหนังสือ", processedById: staffAdmin.id, createdAt: new Date(oneMonthAgo.getTime() + 10 * 24 * 60 * 60 * 1000) },
        ],
    });

    // Member 1: คุณวิชัย — 10 เหรียญ, ใช้ไป 3, เหลือ 7
    const pkg2 = await prisma.coinPackage.create({
        data: {
            userId: createdMembers[1].id,
            packageType: "10_COINS",
            totalCoins: 10,
            remainingCoins: 7,
            pricePaid: 1900,
            bonusAmount: 100,
            firstUsedAt: twoWeeksAgo,
            expiresAt: new Date(twoWeeksAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.coinTransaction.createMany({
        data: [
            { packageId: pkg2.id, type: "CLASS_FEE", coinsUsed: 3, className: "Private Grow to Glow (2 ชม.)", classHours: 2, processedById: staffAdmin.id, createdAt: twoWeeksAgo },
        ],
    });

    // Member 2: คุณนภา — 30 เหรียญ, ใช้ไป 15, เหลือ 15 (ใกล้หมดอายุ!)
    const pkg3 = await prisma.coinPackage.create({
        data: {
            userId: createdMembers[2].id,
            packageType: "30_COINS",
            totalCoins: 30,
            remainingCoins: 15,
            pricePaid: 5400,
            bonusAmount: 600,
            firstUsedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
            expiresAt: threeDaysFromNow, // ← ใกล้หมดอายุ!
        },
    });

    await prisma.coinTransaction.createMany({
        data: [
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 5, className: "Jolly Designer (2 ชม.)", classHours: 2, processedById: superAdmin.id, createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) },
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 6, className: "Summer Camp – Full day", classHours: 8, processedById: superAdmin.id, createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 1, className: "Sensory Play", classHours: 1, processedById: staffAdmin.id, createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 1, className: "Free Play (1 ชม.)", classHours: 1, processedById: staffAdmin.id, createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 1, className: "Inspire Hour – Fashion Design", classHours: 1, processedById: staffAdmin.id, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
            { packageId: pkg3.id, type: "CLASS_FEE", coinsUsed: 1, className: "Sensory Play", classHours: 1, processedById: staffAdmin.id, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        ],
    });

    // Member 3: คุณประภาส — 5 เหรียญ ยังไม่ได้ใช้
    await prisma.coinPackage.create({
        data: {
            userId: createdMembers[3].id,
            packageType: "5_COINS",
            totalCoins: 5,
            remainingCoins: 5,
            pricePaid: 1000,
        },
    });

    // Member 4: คุณพิมพ์ลดา — หมดอายุแล้ว 1 แพ็ค + ซื้อใหม่ 10 เหรียญ
    await prisma.coinPackage.create({
        data: {
            userId: createdMembers[4].id,
            packageType: "5_COINS",
            totalCoins: 5,
            remainingCoins: 0,
            pricePaid: 1000,
            firstUsedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            isExpired: true,
        },
    });

    const pkg5 = await prisma.coinPackage.create({
        data: {
            userId: createdMembers[4].id,
            packageType: "10_COINS",
            totalCoins: 10,
            remainingCoins: 4,
            pricePaid: 1900,
            bonusAmount: 100,
            firstUsedAt: twoWeeksAgo,
            expiresAt: new Date(twoWeeksAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
    });

    await prisma.coinTransaction.createMany({
        data: [
            { packageId: pkg5.id, type: "BOOK_DEPOSIT", coinsUsed: 5, description: "เงินมัดจำหนังสือ (BOR-202602-0003)", processedById: staffAdmin.id, createdAt: twoWeeksAgo },
            { packageId: pkg5.id, type: "BOOK_RENTAL", coinsUsed: 1, description: "ค่ายืมหนังสือ", processedById: staffAdmin.id, createdAt: twoWeeksAgo },
        ],
    });

    console.log("✅ Coin packages & transactions created");

    // ========== 5. Borrow Records ==========

    // Borrow 1: คุณสมศรี ยืม 3 เล่ม — คืนแล้ว
    const brDate1 = new Date(oneMonthAgo.getTime() + 10 * 24 * 60 * 60 * 1000);
    const dueDate1 = new Date(brDate1.getTime() + 14 * 24 * 60 * 60 * 1000);
    await prisma.borrowRecord.create({
        data: {
            code: "BOR-202602-0001",
            userId: createdMembers[0].id,
            borrowDate: brDate1,
            dueDate: dueDate1,
            returnDate: new Date(dueDate1.getTime() - 2 * 24 * 60 * 60 * 1000), // คืนก่อน 2 วัน
            status: "RETURNED",
            depositReturned: true,
            processedById: staffAdmin.id,
            returnedById: staffAdmin.id,
            items: {
                create: [
                    { bookId: createdBooks[0].id },
                    { bookId: createdBooks[1].id },
                    { bookId: createdBooks[2].id },
                ],
            },
        },
    });

    // Borrow 2: คุณวิชัย ยืม 2 เล่ม — กำลังยืม (ยังไม่คืน)
    const brDate2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const dueDate2 = new Date(brDate2.getTime() + 14 * 24 * 60 * 60 * 1000);
    await prisma.borrowRecord.create({
        data: {
            code: "BOR-202602-0002",
            userId: createdMembers[1].id,
            borrowDate: brDate2,
            dueDate: dueDate2,
            status: "BORROWED",
            processedById: staffAdmin.id,
            items: {
                create: [
                    { bookId: createdBooks[3].id },
                    { bookId: createdBooks[4].id },
                ],
            },
        },
    });

    // Mark those books as unavailable
    await prisma.book.updateMany({
        where: { id: { in: [createdBooks[3].id, createdBooks[4].id] } },
        data: { isAvailable: false },
    });

    // Borrow 3: คุณพิมพ์ลดา ยืม 4 เล่ม — กำลังยืม
    const brDate3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const dueDate3 = new Date(brDate3.getTime() + 14 * 24 * 60 * 60 * 1000);
    await prisma.borrowRecord.create({
        data: {
            code: "BOR-202602-0003",
            userId: createdMembers[4].id,
            borrowDate: brDate3,
            dueDate: dueDate3,
            status: "BORROWED",
            processedById: superAdmin.id,
            items: {
                create: [
                    { bookId: createdBooks[5].id },
                    { bookId: createdBooks[6].id },
                    { bookId: createdBooks[7].id },
                    { bookId: createdBooks[8].id },
                ],
            },
        },
    });

    // Mark those books as unavailable
    await prisma.book.updateMany({
        where: { id: { in: [createdBooks[5].id, createdBooks[6].id, createdBooks[7].id, createdBooks[8].id] } },
        data: { isAvailable: false },
    });

    // Borrow 4: คุณนภา ยืม 2 เล่ม — คืนแล้วแต่มีค่าปรับ (คืนช้า 8 วัน)
    const brDate4 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dueDate4 = new Date(brDate4.getTime() + 14 * 24 * 60 * 60 * 1000);
    await prisma.borrowRecord.create({
        data: {
            code: "BOR-202601-0001",
            userId: createdMembers[2].id,
            borrowDate: brDate4,
            dueDate: dueDate4,
            returnDate: new Date(dueDate4.getTime() + 8 * 24 * 60 * 60 * 1000), // คืนช้า 8 วัน
            status: "RETURNED",
            lateFeeCoins: 1,
            depositReturned: true,
            processedById: superAdmin.id,
            returnedById: staffAdmin.id,
            items: {
                create: [
                    { bookId: createdBooks[9].id },
                    { bookId: createdBooks[10].id },
                ],
            },
        },
    });

    console.log("✅ Borrow records created");

    console.log("\n🎉 Demo seeding completed!");
    console.log("───────────────────────────────");
    console.log("Admin: admin@namoland.com / admin123");
    console.log("Staff: staff@namoland.com / admin123");
    console.log(`Members: ${createdMembers.length} families`);
    console.log(`Books: ${createdBooks.length} titles`);
    console.log("Borrows: 4 records (2 active, 2 returned)");
    console.log("───────────────────────────────");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

