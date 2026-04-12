"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getClassSchedules() {
    return prisma.classSchedule.findMany({
        orderBy: { startDate: "desc" },
        include: {
            _count: { select: { entries: true } },
        },
    });
}

export async function getClassSchedulesWithEntries() {
    return prisma.classSchedule.findMany({
        orderBy: { startDate: "desc" },
        include: {
            entries: {
                orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
                include: { teacher: { select: { id: true, name: true, nickname: true, color: true } } },
            },
            _count: { select: { entries: true } },
        },
    });
}

export async function getClassScheduleById(id: string) {
    return prisma.classSchedule.findUnique({
        where: { id },
        include: {
            entries: {
                orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
                include: { teacher: { select: { id: true, name: true, nickname: true, color: true } } },
            },
        },
    });
}

export async function createClassSchedule(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const theme = (formData.get("theme") as string)?.trim() || null;
    const startDateStr = formData.get("startDate") as string;

    if (!startDateStr) {
        return { error: "กรุณาเลือกวันที่เริ่มต้น (วันจันทร์)" };
    }

    // Parse as local date (avoid UTC midnight shift)
    const [y, m, d] = startDateStr.split("-").map(Number);
    const startDate = new Date(y, m - 1, d);
    // Ensure startDate is a Monday
    const day = startDate.getDay();
    if (day !== 1) {
        // Adjust to Monday
        const diff = day === 0 ? -6 : 1 - day;
        startDate.setDate(startDate.getDate() + diff);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const schedule = await prisma.classSchedule.create({
        data: {
            theme,
            startDate,
            endDate,
        },
    });

    revalidatePath("/classes");
    return { success: true, id: schedule.id };
}

export async function updateClassSchedule(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const theme = (formData.get("theme") as string)?.trim() || null;

    if (!id) return { error: "ไม่พบตาราง" };

    await prisma.classSchedule.update({
        where: { id },
        data: { theme },
    });

    revalidatePath(`/classes/${id}`);
    revalidatePath("/classes");
    return { success: true };
}

export async function deleteClassSchedule(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    await prisma.classSchedule.delete({ where: { id } });

    revalidatePath("/classes");
    return { success: true };
}

export async function addClassEntry(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const scheduleId = formData.get("scheduleId") as string;
    const dayOfWeek = parseInt(formData.get("dayOfWeek") as string);
    const startTime = (formData.get("startTime") as string)?.trim();
    const endTime = (formData.get("endTime") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const teacherId = (formData.get("teacherId") as string)?.trim() || null;

    if (!scheduleId || isNaN(dayOfWeek) || !startTime || !endTime || !title) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    await prisma.classEntry.create({
        data: { scheduleId, dayOfWeek, startTime, endTime, title, sortOrder, teacherId },
    });

    revalidatePath(`/classes/${scheduleId}`);
    return { success: true };
}

export async function updateClassEntry(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const startTime = (formData.get("startTime") as string)?.trim();
    const endTime = (formData.get("endTime") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const teacherId = (formData.get("teacherId") as string)?.trim() || null;

    if (!id || !startTime || !endTime || !title) {
        return { error: "กรุณากรอกข้อมูลให้ครบ" };
    }

    const entry = await prisma.classEntry.update({
        where: { id },
        data: { startTime, endTime, title, sortOrder, teacherId },
    });

    revalidatePath(`/classes/${entry.scheduleId}`);
    return { success: true };
}

export async function deleteClassEntry(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const entry = await prisma.classEntry.findUnique({ where: { id } });
    if (!entry) return { error: "ไม่พบคลาส" };

    await prisma.classEntry.delete({ where: { id } });

    revalidatePath(`/classes/${entry.scheduleId}`);
    return { success: true };
}

export async function duplicateSchedule(id: string) {
    const session = await auth();
    if (!session?.user || session.user.type !== "ADMIN") return { error: "Unauthorized" };

    const source = await prisma.classSchedule.findUnique({
        where: { id },
        include: { entries: true },
    });

    if (!source) return { error: "ไม่พบตารางต้นฉบับ" };

    // Next week
    const newStart = new Date(source.startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 6);

    const newSchedule = await prisma.classSchedule.create({
        data: {
            theme: source.theme,
            startDate: newStart,
            endDate: newEnd,
            entries: {
                create: source.entries.map((e) => ({
                    dayOfWeek: e.dayOfWeek,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    title: e.title,
                    sortOrder: e.sortOrder,
                    teacherId: e.teacherId,
                })),
            },
        },
    });

    revalidatePath("/classes");
    return { success: true, id: newSchedule.id };
}

export async function getRecentClassEntriesByActivity(activityTitle: string) {
    if (!activityTitle) return [];

    const twoWeeksFuture = new Date();
    twoWeeksFuture.setDate(twoWeeksFuture.getDate() + 14);

    const schedules = await prisma.classSchedule.findMany({
        where: {
            startDate: { lte: twoWeeksFuture }
        },
        include: {
            entries: {
                where: { title: { contains: activityTitle, mode: 'insensitive' } },
                include: { teacher: { select: { name: true, nickname: true } } }
            }
        }
    });

    const results: {
        id: string;
        title: string;
        date: string;
        startTime: string;
        endTime: string;
        teacherName: string | null;
    }[] = [];

    for (const s of schedules) {
        for (const e of s.entries) {
            // Reconstruct the exact localized date 
            const classDate = new Date(s.startDate.getTime());
            classDate.setUTCHours(classDate.getUTCHours() + 7);
            const dayOffset = e.dayOfWeek;
            classDate.setUTCDate(classDate.getUTCDate() + dayOffset);
            classDate.setUTCHours(classDate.getUTCHours() - 7);

            results.push({
                id: e.id,
                title: e.title,
                date: classDate.toISOString(),
                startTime: e.startTime,
                endTime: e.endTime,
                teacherName: e.teacher?.nickname || e.teacher?.name || null
            });
        }
    }
    
    // Sort by chronological date (newest first for UI dropdown)
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
