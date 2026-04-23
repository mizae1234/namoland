import { Suspense } from "react";
import { getShopInfo } from "@/actions/shop";
import { getAllPackageConfigs } from "@/actions/packageConfig";
import { getAllActivityConfigs } from "@/actions/activityConfig";
import { getClassSchedulesWithEntries } from "@/actions/classSchedule";
import { getAllTeachers } from "@/actions/teacher";
import { getAdminUsers } from "@/actions/admin";
import { auth } from "@/lib/auth";
import SettingsTabs from "./_components/SettingsTabs";
import { getTranslations } from "next-intl/server";

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

    const t = await getTranslations("AdminSettings");

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#3d405b]">{t("pageTitle")}</h1>
                <p className="text-[#3d405b]/50 mt-1">{t("pageDesc")}</p>
            </div>

            <Suspense fallback={<div className="text-center py-8 text-[#3d405b]/40">{t("loading")}</div>}>
                <SettingsTabs
                    shopInfo={shopInfo}
                    packages={JSON.parse(JSON.stringify(packages))}
                    activities={JSON.parse(JSON.stringify(activities))}
                    schedules={JSON.parse(JSON.stringify(schedules))}
                    teachers={JSON.parse(JSON.stringify(teachers))}
                    adminUsers={adminUsers}
                    currentUserId={session?.user?.id || ""}
                    userRole={session?.user?.role || "ADMIN"}
                />
            </Suspense>
        </div>
    );
}
