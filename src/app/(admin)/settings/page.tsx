import { Suspense } from "react";
import { getShopInfo } from "@/actions/shop";
import { getAllPackageConfigs } from "@/actions/packageConfig";
import { getAllActivityConfigs } from "@/actions/activityConfig";
import { getClassSchedulesWithEntries } from "@/actions/classSchedule";
import { getAllTeachers } from "@/actions/teacher";
import { getAdminUsers } from "@/actions/admin";
import { auth } from "@/lib/auth";
import SettingsTabs from "./_components/SettingsTabs";

export default async function SettingsPage() {
    const [shopInfo, packages, activities, schedules, teachers, adminUsers, session] =
        await Promise.all([
            getShopInfo(),
            getAllPackageConfigs(),
            getAllActivityConfigs(),
            getClassSchedulesWithEntries(),
            getAllTeachers(),
            getAdminUsers(),
            auth(),
        ]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#3d405b]">ตั้งค่า</h1>
                <p className="text-[#3d405b]/50 mt-1">จัดการข้อมูลร้าน แพ็คเกจ กิจกรรม ครูผู้สอน ตารางคลาส และผู้ใช้ระบบ</p>
            </div>

            <Suspense fallback={<div className="text-center py-8 text-[#3d405b]/40">กำลังโหลด...</div>}>
                <SettingsTabs
                    shopInfo={shopInfo}
                    packages={JSON.parse(JSON.stringify(packages))}
                    activities={JSON.parse(JSON.stringify(activities))}
                    schedules={JSON.parse(JSON.stringify(schedules))}
                    teachers={JSON.parse(JSON.stringify(teachers))}
                    adminUsers={adminUsers}
                    currentUserId={session?.user?.id || ""}
                />
            </Suspense>
        </div>
    );
}
