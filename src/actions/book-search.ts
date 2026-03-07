"use server";

import prisma from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function searchBooks(search: string, skip: number) {
    const where = {
        isActive: true,
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: "insensitive" as const } },
                    { category: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {}),
    };

    const [books, total] = await Promise.all([
        prisma.book.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: PAGE_SIZE,
        }),
        prisma.book.count({ where }),
    ]);

    return { books, total, hasMore: skip + PAGE_SIZE < total };
}
