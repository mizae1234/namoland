"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { calculateLateFee } from "@/lib/utils";
import { BORROW_DEPOSIT_COINS, BORROW_RENTAL_COINS, BORROW_DURATION_DAYS, DAMAGE_FEE_PER_BOOK } from "@/lib/constants";

export async function createBook(formData: FormData) {
    const title = formData.get("title") as string;
    const isbn = formData.get("isbn") as string;
    const category = formData.get("category") as string;
    const ageRange = formData.get("ageRange") as string;
    const youtubeUrl = formData.get("youtubeUrl") as string;

    if (!title) return { error: "กรุณากรอกชื่อหนังสือ" };

    const qrCode = `BOOK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    await prisma.book.create({
        data: {
            title,
            qrCode,
            isbn: isbn || null,
            category: category || null,
            ageRange: ageRange || null,
            youtubeUrl: youtubeUrl || null,
        },
    });

    revalidatePath("/books");
    return { success: true };
}

export async function getBookById(id: string) {
    return prisma.book.findUnique({
        where: { id },
        include: {
            borrowItems: {
                include: {
                    borrowRecord: {
                        include: { user: true },
                    },
                },
                orderBy: { borrowRecord: { createdAt: "desc" } },
            },
        },
    });
}

export async function updateBook(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const isbn = formData.get("isbn") as string;
    const category = formData.get("category") as string;
    const ageRange = formData.get("ageRange") as string;
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const isActive = formData.get("isActive") === "true";

    if (!title) return { error: "กรุณากรอกชื่อหนังสือ" };

    await prisma.book.update({
        where: { id },
        data: {
            title,
            isbn: isbn || null,
            category: category || null,
            ageRange: ageRange || null,
            youtubeUrl: youtubeUrl || null,
            isActive,
        },
    });

    revalidatePath("/books");
    revalidatePath(`/books/${id}`);
    return { success: true };
}

export async function deleteBook(id: string) {
    // Check if book is currently borrowed
    const activeBorrows = await prisma.borrowItem.count({
        where: {
            bookId: id,
            borrowRecord: { status: "BORROWED" },
        },
    });

    if (activeBorrows > 0) {
        return { error: "ไม่สามารถลบได้ หนังสือกำลังถูกยืมอยู่" };
    }

    // Delete related borrow items first (historical)
    await prisma.borrowItem.deleteMany({ where: { bookId: id } });

    await prisma.book.delete({ where: { id } });

    revalidatePath("/books");
    return { success: true };
}

export async function getBooks(search?: string, status?: string) {
    const books = await prisma.book.findMany({
        where: search
            ? {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { isbn: { contains: search, mode: "insensitive" } },
                    { category: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
        include: {
            borrowItems: {
                where: { borrowRecord: { status: "BORROWED" } },
                include: { borrowRecord: { include: { user: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    if (status === "inactive") return books.filter((b) => !b.isActive);
    if (status === "available") return books.filter((b) => b.isActive && b.borrowItems.length === 0);
    if (status === "borrowed") return books.filter((b) => b.isActive && b.borrowItems.length > 0);
    return books;
}

export async function getBookByQrCode(qrCode: string) {
    return prisma.book.findUnique({
        where: { qrCode },
        include: {
            borrowItems: {
                where: { borrowRecord: { status: "BORROWED" } },
                include: { borrowRecord: { include: { user: true } } },
            },
        },
    });
}

export async function createBorrow(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const userId = formData.get("userId") as string;
    const bookIdsJson = formData.get("bookIds") as string;
    const bookIds: string[] = JSON.parse(bookIdsJson);

    if (!userId || bookIds.length === 0) return { error: "ข้อมูลไม่ครบ" };
    if (bookIds.length > 5) return { error: "ยืมได้สูงสุด 5 เล่ม" };

    // Get user's active coin packages
    const packages = await prisma.coinPackage.findMany({
        where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
        orderBy: { createdAt: "asc" },
    });

    const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);
    const requiredCoins = BORROW_DEPOSIT_COINS + BORROW_RENTAL_COINS;

    if (totalCoins < requiredCoins) {
        return { error: `เหรียญไม่เพียงพอ (ต้องการ ${requiredCoins} เหรียญ, มี ${totalCoins})` };
    }

    // Generate borrow code
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await prisma.borrowRecord.count();
    const code = `BOR-${yearMonth}-${String(count + 1).padStart(4, "0")}`;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    // Deduct coins from packages (oldest first)
    let remaining = requiredCoins;
    const deductions: { packageId: string; amount: number }[] = [];

    for (const pkg of packages) {
        if (remaining <= 0) break;
        const deduct = Math.min(pkg.remainingCoins, remaining);
        deductions.push({ packageId: pkg.id, amount: deduct });
        remaining -= deduct;
    }

    await prisma.$transaction([
        // Create borrow record
        prisma.borrowRecord.create({
            data: {
                code,
                userId,
                borrowDate: now,
                dueDate,
                processedById: session.user.id,
                items: {
                    create: bookIds.map((bookId) => ({ bookId })),
                },
            },
        }),
        // Deduct coins
        ...deductions.map((d) =>
            prisma.coinPackage.update({
                where: { id: d.packageId },
                data: {
                    remainingCoins: { decrement: d.amount },
                    ...(
                        // Start expiry clock if first use
                        !packages.find(p => p.id === d.packageId)?.firstUsedAt
                            ? {
                                firstUsedAt: now,
                                expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                            }
                            : {}
                    ),
                },
            })
        ),
        // Record transactions
        ...deductions.map((d) =>
            prisma.coinTransaction.create({
                data: {
                    packageId: d.packageId,
                    type: "BOOK_DEPOSIT",
                    coinsUsed: Math.min(d.amount, BORROW_DEPOSIT_COINS),
                    description: `เงินมัดจำหนังสือ (${code})`,
                    processedById: session.user.id,
                },
            })
        ),
        // Mark books as unavailable
        ...bookIds.map((bookId) =>
            prisma.book.update({
                where: { id: bookId },
                data: { isAvailable: false },
            })
        ),
    ]);

    revalidatePath("/borrows");
    revalidatePath("/members");
    revalidatePath("/books");
    return { success: true };
}


export async function returnBooks(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const borrowId = formData.get("borrowId") as string;
    const damagedItemsJson = formData.get("damagedItems") as string;
    const damagedItems: string[] = damagedItemsJson ? JSON.parse(damagedItemsJson) : [];

    const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
        include: { items: true, user: { include: { coinPackages: { where: { isExpired: false, remainingCoins: { gt: 0 } } } } } },
    });

    if (!record) return { error: "ไม่พบรายการยืม" };

    const now = new Date();
    const { feeCoins, forfeitDeposit } = calculateLateFee(record.dueDate, now);
    const damageCount = damagedItems.length;
    const damageFee = damageCount * DAMAGE_FEE_PER_BOOK;

    const updates = [];

    // Update borrow record
    updates.push(
        prisma.borrowRecord.update({
            where: { id: borrowId },
            data: {
                status: forfeitDeposit ? "FORFEITED" : "RETURNED",
                returnDate: now,
                lateFeeCoins: feeCoins,
                damageFeeCoins: damageFee,
                depositReturned: !forfeitDeposit,
                depositForfeited: forfeitDeposit,
                returnedById: session.user.id,
            },
        })
    );

    // Mark damaged items
    for (const itemId of damagedItems) {
        updates.push(
            prisma.borrowItem.update({
                where: { id: itemId },
                data: { isDamaged: true, damageNote: "เสียหาย/ชำรุด" },
            })
        );
    }

    // Mark books as available again
    for (const item of record.items) {
        updates.push(
            prisma.book.update({
                where: { id: item.bookId },
                data: { isAvailable: true },
            })
        );
    }

    await prisma.$transaction(updates);

    revalidatePath("/borrows");
    revalidatePath("/members");
    revalidatePath("/books");

    return {
        success: true,
        lateFee: feeCoins,
        damageFee,
        forfeitDeposit,
        depositReturned: !forfeitDeposit ? BORROW_DEPOSIT_COINS : 0,
    };
}

export async function getBorrows(params?: {
    search?: string;
    from?: string;
    to?: string;
}) {
    const where: Record<string, unknown>[] = [];

    if (params?.search) {
        where.push({
            OR: [
                { code: { contains: params.search, mode: "insensitive" } },
                { user: { parentName: { contains: params.search, mode: "insensitive" } } },
                { items: { some: { book: { title: { contains: params.search, mode: "insensitive" } } } } },
            ],
        });
    }

    if (params?.from) {
        where.push({ borrowDate: { gte: new Date(params.from) } });
    }

    if (params?.to) {
        const toDate = new Date(params.to);
        toDate.setHours(23, 59, 59, 999);
        where.push({ borrowDate: { lte: toDate } });
    }

    return prisma.borrowRecord.findMany({
        where: where.length > 0 ? { AND: where } : undefined,
        include: {
            user: true,
            items: { include: { book: true } },
            processedBy: true,
        },
        orderBy: { borrowDate: "desc" },
    });
}

export async function getBookByQrCodePublic(qrCode: string) {
    return prisma.book.findUnique({
        where: { qrCode },
        select: {
            id: true,
            title: true,
            category: true,
            ageRange: true,
            youtubeUrl: true,
            isAvailable: true,
            isActive: true,
            qrCode: true,
        },
    });
}

export async function reserveBook(bookId: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") {
        return { error: "กรุณาเข้าสู่ระบบก่อน" };
    }

    const userId = session.user.id;

    // Check book availability
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || !book.isActive) return { error: "ไม่พบหนังสือ" };
    if (!book.isAvailable) return { error: "หนังสือถูกยืมอยู่แล้ว" };

    // Check if user already has a RESERVED record for this book
    const existingReserve = await prisma.borrowRecord.findFirst({
        where: {
            userId,
            status: "RESERVED",
            items: { some: { bookId } },
        },
    });
    if (existingReserve) return { error: "คุณจองหนังสือเล่มนี้อยู่แล้ว" };

    // Get user's coin packages
    const packages = await prisma.coinPackage.findMany({
        where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
        orderBy: { createdAt: "asc" },
    });

    const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);
    const requiredCoins = BORROW_DEPOSIT_COINS + BORROW_RENTAL_COINS;

    if (totalCoins < requiredCoins) {
        return { error: `เหรียญไม่เพียงพอ (ต้องการ ${requiredCoins} เหรียญ, มี ${totalCoins})` };
    }

    // Generate borrow code
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await prisma.borrowRecord.count();
    const code = `BOR-${yearMonth}-${String(count + 1).padStart(4, "0")}`;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    // Deduct coins
    let remaining = requiredCoins;
    const deductions: { packageId: string; amount: number }[] = [];

    for (const pkg of packages) {
        if (remaining <= 0) break;
        const deduct = Math.min(pkg.remainingCoins, remaining);
        deductions.push({ packageId: pkg.id, amount: deduct });
        remaining -= deduct;
    }

    await prisma.$transaction([
        prisma.borrowRecord.create({
            data: {
                code,
                userId,
                status: "RESERVED",
                borrowDate: now,
                dueDate,
                items: {
                    create: [{ bookId }],
                },
            },
        }),
        ...deductions.map((d) =>
            prisma.coinPackage.update({
                where: { id: d.packageId },
                data: {
                    remainingCoins: { decrement: d.amount },
                    ...(!packages.find(p => p.id === d.packageId)?.firstUsedAt
                        ? {
                            firstUsedAt: now,
                            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        }
                        : {}
                    ),
                },
            })
        ),
        prisma.book.update({
            where: { id: bookId },
            data: { isAvailable: false },
        }),
    ]);

    revalidatePath("/borrows");
    revalidatePath("/user");
    return { success: true, code };
}

export async function confirmReservation(borrowId: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
    });

    if (!record) return { error: "ไม่พบรายการ" };
    if (record.status !== "RESERVED") return { error: "รายการนี้ไม่ได้อยู่ในสถานะรอรับ" };

    await prisma.borrowRecord.update({
        where: { id: borrowId },
        data: {
            status: "BORROWED",
            borrowDate: new Date(),
            dueDate: new Date(Date.now() + BORROW_DURATION_DAYS * 24 * 60 * 60 * 1000),
            processedById: session.user.id,
        },
    });

    revalidatePath("/borrows");
    return { success: true };
}
