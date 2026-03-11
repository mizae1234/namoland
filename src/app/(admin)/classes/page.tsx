import { getClassSchedulesWithEntries } from "@/actions/classSchedule";
import ScheduleList from "./_components/ScheduleList";

export default async function ClassesPage() {
    const schedules = await getClassSchedulesWithEntries();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">ตารางคลาส</h1>
                <p className="text-[#3d405b]/50 mt-1">จัดการตารางกิจกรรมรายสัปดาห์</p>
            </div>

            <ScheduleList schedules={JSON.parse(JSON.stringify(schedules))} />
        </div>
    );
}
