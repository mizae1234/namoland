import { getClassScheduleById } from "@/actions/classSchedule";
import { getActiveActivities } from "@/actions/activityConfig";
import { getActiveTeachers } from "@/actions/teacher";
import { notFound } from "next/navigation";
import WeeklyCalendar from "./_components/WeeklyCalendar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const t = await getTranslations("AdminClasses.detail");
    const { id } = await params;
    const [schedule, activities, teachers] = await Promise.all([
        getClassScheduleById(id),
        getActiveActivities(),
        getActiveTeachers(),
    ]);

    if (!schedule) return notFound();

    return (
        <div>
            <div className="mb-6">
                <Link href="/classes" className="inline-flex items-center gap-1.5 text-sm text-[#3d405b]/50 hover:text-[#3d405b] transition-colors mb-3">
                    <ArrowLeft size={16} />
                    {t("backToList")}
                </Link>
                <h1 className="text-2xl font-bold text-[#3d405b]">{t("title")}</h1>
            </div>

            <WeeklyCalendar
                schedule={JSON.parse(JSON.stringify(schedule))}
                activities={JSON.parse(JSON.stringify(activities))}
                teachers={JSON.parse(JSON.stringify(teachers))}
            />
        </div>
    );
}
