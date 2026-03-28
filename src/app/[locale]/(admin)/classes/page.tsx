import { getClassSchedulesWithEntries } from "@/actions/classSchedule";
import ScheduleList from "./_components/ScheduleList";
import PageHeader from "@/components/ui/PageHeader";

export default async function ClassesPage() {
    const rawSchedules = await getClassSchedulesWithEntries();
    const schedules = rawSchedules.map((s) => ({
        id: s.id,
        theme: s.theme,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        entries: s.entries.map((e) => ({
            id: e.id,
            dayOfWeek: e.dayOfWeek,
            startTime: e.startTime,
            endTime: e.endTime,
            title: e.title,
        })),
        _count: { entries: s.entries.length },
    }));

    return (
        <div>
            <PageHeader
                title="ตารางคลาส"
                subtitle="ดูตารางคลาสและจองให้สมาชิก"
            />
            <ScheduleList schedules={schedules} mode="booking" />
        </div>
    );
}
