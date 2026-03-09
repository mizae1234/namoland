"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { calculateLateFee } from "@/lib/utils";
import { BORROW_DEPOSIT_COINS, BORROW_DURATION_DAYS, DAMAGE_FEE_PER_BOOK } from "@/lib/constants";

export async function createBook(formData: FormData) {
    const title = formData.get("title") as string;
    const isbn = formData.get("isbn") as string;
    const category = formData.get("category") as string;
    const ageRange = formData.get("ageRange") as string;
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const rentalCostStr = formData.get("rentalCost") as string;

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
            rentalCost: rentalCostStr ? parseInt(rentalCostStr) : 1,
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
                        include: { user: true, items: true },
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
    const rentalCostStr = formData.get("rentalCost") as string;

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
            rentalCost: rentalCostStr ? parseInt(rentalCostStr) : 1,
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

    // Get books to calculate per-book rental
    const books = await prisma.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, title: true, rentalCost: true, isAvailable: true },
    });

    if (books.length !== bookIds.length) return { error: "ไม่พบหนังสือบางเล่ม" };
    const unavailable = books.filter(b => !b.isAvailable);
    if (unavailable.length > 0) return { error: "หนังสือบางเล่มถูกยืมอยู่แล้ว" };

    const totalRentalCoins = books.reduce((sum, b) => sum + b.rentalCost, 0);

    // Check if user already has an active deposit (BORROWED with deposit not returned/forfeited)
    const activeDepositCount = await prisma.borrowRecord.count({
        where: {
            userId,
            status: "BORROWED",
            depositReturned: false,
            depositForfeited: false,
        },
    });
    const hasActiveDeposit = activeDepositCount > 0;
    const depositCoins = hasActiveDeposit ? 0 : BORROW_DEPOSIT_COINS;

    // Get user's active coin packages
    const packages = await prisma.coinPackage.findMany({
        where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
        orderBy: { createdAt: "asc" },
    });

    const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);
    const requiredCoins = depositCoins + totalRentalCoins;

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

    const txOps = [
        // Create borrow record
        prisma.borrowRecord.create({
            data: {
                code,
                userId,
                borrowDate: now,
                dueDate,
                rentalCoins: totalRentalCoins,
                depositCoins,
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
        // Record per-book rental transactions
        ...books.map((book) =>
            prisma.coinTransaction.create({
                data: {
                    packageId: deductions[0].packageId,
                    type: "BOOK_RENTAL",
                    coinsUsed: book.rentalCost,
                    description: `${book.title} (${code})`,
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
    ];

    // Only record deposit transaction if actually charging deposit
    if (depositCoins > 0) {
        txOps.push(
            prisma.coinTransaction.create({
                data: {
                    packageId: deductions[0].packageId,
                    type: "BOOK_DEPOSIT",
                    coinsUsed: depositCoins,
                    description: `เงินมัดจำหนังสือ (${code})`,
                    processedById: session.user.id,
                },
            })
        );
    }

    await prisma.$transaction(txOps);

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
    const customDamageFeeStr = formData.get("customDamageFee") as string;
    const returnItemIdsJson = formData.get("returnItemIds") as string;
    const returnItemIds: string[] | null = returnItemIdsJson ? JSON.parse(returnItemIdsJson) : null;

    const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
        include: { items: true, user: { include: { coinPackages: { where: { isExpired: false, remainingCoins: { gt: 0 } } } } } },
    });

    if (!record) return { error: "ไม่พบรายการยืม" };

    // Determine which items to return
    const itemsToReturn = returnItemIds
        ? record.items.filter(item => returnItemIds.includes(item.id))
        : record.items;

    if (itemsToReturn.length === 0) return { error: "กรุณาเลือกหนังสือที่ต้องการคืน" };

    // Check which items remain after this return
    const previouslyReturnedIds = record.items.filter(item => item.returned).map(item => item.id);
    const newReturnIds = itemsToReturn.map(item => item.id);
    const allReturnedIds = [...previouslyReturnedIds, ...newReturnIds];
    const isFullReturn = allReturnedIds.length >= record.items.length;

    const now = new Date();
    const { feeCoins, forfeitDeposit } = calculateLateFee(record.dueDate, now);
    // Use custom damage fee if provided, otherwise fall back to per-book constant
    const damageFee = customDamageFeeStr ? parseInt(customDamageFeeStr) : damagedItems.length * DAMAGE_FEE_PER_BOOK;

    const updates = [];

    if (isFullReturn) {
        // All books returned — finalize the record
        // Check if user has OTHER active borrowed records (excluding this one)
        const otherActiveBorrows = await prisma.borrowRecord.count({
            where: {
                userId: record.userId,
                id: { not: borrowId },
                status: "BORROWED",
                depositReturned: false,
                depositForfeited: false,
            },
        });
        const isLastBorrow = otherActiveBorrows === 0;

        // Only return deposit if this is the last active borrow AND not forfeited
        const shouldReturnDeposit = isLastBorrow && !forfeitDeposit && record.depositCoins > 0;
        // For records with depositCoins=0 (shared deposit), just mark as returned
        const shouldMarkReturned = record.depositCoins === 0 ? true : shouldReturnDeposit;

        // Update borrow record
        updates.push(
            prisma.borrowRecord.update({
                where: { id: borrowId },
                data: {
                    status: forfeitDeposit ? "FORFEITED" : "RETURNED",
                    returnDate: now,
                    lateFeeCoins: feeCoins,
                    damageFeeCoins: damageFee,
                    depositReturned: shouldMarkReturned,
                    depositForfeited: forfeitDeposit,
                    returnedById: session.user.id,
                },
            })
        );

        // If this is the last borrow and deposit is returned, also mark all other
        // RETURNED records (with depositCoins=0) as depositReturned
        if (shouldReturnDeposit) {
            updates.push(
                prisma.borrowRecord.updateMany({
                    where: {
                        userId: record.userId,
                        status: "RETURNED",
                        depositReturned: false,
                        depositForfeited: false,
                        depositCoins: 0,
                    },
                    data: { depositReturned: true },
                })
            );

            // Refund deposit coins to the earliest active package
            const refundPkg = record.user.coinPackages[0];
            if (refundPkg) {
                updates.push(
                    prisma.coinPackage.update({
                        where: { id: refundPkg.id },
                        data: { remainingCoins: { increment: record.depositCoins } },
                    })
                );
            }
        }
    } else {
        // Partial return — keep record as BORROWED, no deposit logic yet
    }

    // Mark damaged items
    for (const itemId of damagedItems) {
        if (itemsToReturn.some(i => i.id === itemId)) {
            updates.push(
                prisma.borrowItem.update({
                    where: { id: itemId },
                    data: { isDamaged: true, damageNote: "เสียหาย/ชำรุด" },
                })
            );
        }
    }

    // Mark returned items and release their books
    for (const item of itemsToReturn) {
        updates.push(
            prisma.borrowItem.update({
                where: { id: item.id },
                data: { returned: true, returnedAt: now },
            })
        );
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
    revalidatePath("/user");

    return {
        success: true,
        lateFee: isFullReturn ? feeCoins : 0,
        damageFee,
        forfeitDeposit: isFullReturn ? forfeitDeposit : false,
        depositReturned: isFullReturn ? (record.depositCoins > 0 ? record.depositCoins : 0) : 0,
        isFullReturn,
        returnedCount: itemsToReturn.length,
        remainingCount: record.items.length - allReturnedIds.length,
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

    // Get user's coin packages — only hold RENTAL coins (not deposit yet)
    const packages = await prisma.coinPackage.findMany({
        where: { userId, isExpired: false, remainingCoins: { gt: 0 } },
        orderBy: { createdAt: "asc" },
    });

    const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);
    const requiredCoins = book.rentalCost; // Per-book rental cost

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

    // Deduct ONLY rental coins
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
                rentalCoins: book.rentalCost,
                depositCoins: 0, // Deposit not charged yet
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

    // Auto-update coinExpiryOverride if any package got a new expiresAt
    const hasNewExpiry = deductions.some(d => !packages.find(p => p.id === d.packageId)?.firstUsedAt);
    if (hasNewExpiry) {
        const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
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

    revalidatePath("/borrows");
    revalidatePath("/user");
    revalidatePath("/user/books");
    return { success: true, code };
}

export async function confirmReservation(borrowId: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
        include: { user: true },
    });

    if (!record) return { error: "ไม่พบรายการ" };
    if (record.status !== "RESERVED") return { error: "รายการนี้ไม่ได้อยู่ในสถานะรอรับ" };

    // Check how many active BORROWED books user has (with deposit already paid)
    const activeBorrowedCount = await prisma.borrowRecord.count({
        where: {
            userId: record.userId,
            status: "BORROWED",
            depositReturned: false,
            depositForfeited: false,
        },
    });

    // Deposit covers up to 5 books. If user already has active deposit, skip deposit charge.
    const hasActiveDeposit = activeBorrowedCount > 0;
    const depositToCharge = hasActiveDeposit ? 0 : BORROW_DEPOSIT_COINS;

    const now = new Date();

    if (depositToCharge > 0) {
        // Need to deduct deposit coins
        const packages = await prisma.coinPackage.findMany({
            where: { userId: record.userId, isExpired: false, remainingCoins: { gt: 0 } },
            orderBy: { createdAt: "asc" },
        });

        const totalCoins = packages.reduce((sum, p) => sum + p.remainingCoins, 0);

        if (totalCoins < depositToCharge) {
            return { error: `สมาชิกมีเหรียญไม่พอสำหรับมัดจำ (ต้องการ ${depositToCharge}, มี ${totalCoins})` };
        }

        let remaining = depositToCharge;
        const deductions: { packageId: string; amount: number }[] = [];
        for (const pkg of packages) {
            if (remaining <= 0) break;
            const deduct = Math.min(pkg.remainingCoins, remaining);
            deductions.push({ packageId: pkg.id, amount: deduct });
            remaining -= deduct;
        }

        await prisma.$transaction([
            prisma.borrowRecord.update({
                where: { id: borrowId },
                data: {
                    status: "BORROWED",
                    borrowDate: now,
                    dueDate: new Date(now.getTime() + BORROW_DURATION_DAYS * 24 * 60 * 60 * 1000),
                    depositCoins: BORROW_DEPOSIT_COINS,
                    processedById: session.user.id,
                },
            }),
            ...deductions.map((d) =>
                prisma.coinPackage.update({
                    where: { id: d.packageId },
                    data: { remainingCoins: { decrement: d.amount } },
                })
            ),
        ]);
    } else {
        // No deposit needed — already covered by existing deposit
        await prisma.borrowRecord.update({
            where: { id: borrowId },
            data: {
                status: "BORROWED",
                borrowDate: now,
                dueDate: new Date(now.getTime() + BORROW_DURATION_DAYS * 24 * 60 * 60 * 1000),
                depositCoins: 0, // No deposit charged for this record
                processedById: session.user.id,
            },
        });
    }

    revalidatePath("/borrows");
    revalidatePath("/user");
    return { success: true };
}

export async function cancelReservation(borrowId: string) {
    const session = await auth();
    if (!session?.user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

    const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
        include: { items: true },
    });

    if (!record) return { error: "ไม่พบรายการ" };
    if (record.status !== "RESERVED") return { error: "รายการนี้ไม่ได้อยู่ในสถานะจอง" };

    // Only the owner or admin can cancel
    if (session.user.type === "USER" && record.userId !== session.user.id) {
        return { error: "ไม่มีสิทธิ์ยกเลิกรายการนี้" };
    }

    // Refund rental coins
    const refundCoins = record.rentalCoins;
    const packages = await prisma.coinPackage.findMany({
        where: { userId: record.userId, isExpired: false },
        orderBy: { createdAt: "asc" },
    });

    // Refund to the earliest non-expired package
    const targetPkg = packages[0];
    if (!targetPkg) return { error: "ไม่พบแพ็คเกจเหรียญสำหรับคืน" };

    await prisma.$transaction([
        // Refund coins
        prisma.coinPackage.update({
            where: { id: targetPkg.id },
            data: { remainingCoins: { increment: refundCoins } },
        }),
        // Release books
        ...record.items.map((item) =>
            prisma.book.update({
                where: { id: item.bookId },
                data: { isAvailable: true },
            })
        ),
        // Set status to CANCELLED (preserve history)
        prisma.borrowRecord.update({
            where: { id: borrowId },
            data: {
                status: "CANCELLED",
                returnDate: new Date(),
                depositReturned: false,
                depositForfeited: false,
            },
        }),
    ]);

    revalidatePath("/borrows");
    revalidatePath("/user");
    revalidatePath("/user/books");
    revalidatePath("/user/borrows");
    return { success: true };
}

export async function rejectReservation(borrowId: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    // Reuse cancel logic — same coin refund
    return cancelReservation(borrowId);
}
