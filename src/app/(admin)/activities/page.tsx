import { getAllActivityConfigs } from "@/actions/activityConfig";
import ActivityManager from "./_components/ActivityManager";

export default async function ActivitiesPage() {
    const activities = await getAllActivityConfigs();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#3d405b]">จัดการกิจกรรม</h1>
                <p className="text-[#3d405b]/50 mt-1">เพิ่ม แก้ไข หรือปิดกิจกรรม พร้อมกำหนดค่าเหรียญ</p>
            </div>

            <ActivityManager activities={JSON.parse(JSON.stringify(activities))} />
        </div>
    );
}
