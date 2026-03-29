import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { User, QrCode } from "lucide-react";
import UserLogout from "./UserLogout";
import ProfileEditForm from "./ProfileEditForm";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default async function UserProfilePage() {
    const t = await getTranslations("UserProfile");
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { children: true },
    });

    if (!user) return <div className="p-4 text-center text-[#3d405b]/40">{t("notFound")}</div>;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-[#3d405b]">{t("title")}</h1>
            </div>

            {/* Avatar & QR */}
            <div className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20 mb-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-[#81b29a]/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={24} className="text-[#609279]" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[#3d405b] text-lg">{user.parentName}</h2>
                        <p className="text-sm text-[#3d405b]/50">{user.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#f4f1de]/50 rounded-xl">
                    <QrCode size={16} className="text-[#3d405b]/40" />
                    <span className="text-sm text-[#3d405b]/70 font-mono">{user.qrCode}</span>
                </div>
            </div>

            {/* Language Setting Row */}
            <div className="bg-white rounded-2xl p-4 border border-[#d1cce7]/20 mb-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-[#3d405b] text-sm">ภาษา / Language</h3>
                    <p className="text-xs text-[#3d405b]/50 mt-0.5">เลือกภาษาที่ต้องการใช้</p>
                </div>
                <LanguageSwitcher />
            </div>

            {/* Editable Profile + Password */}
            <ProfileEditForm user={JSON.parse(JSON.stringify(user))} />

            {/* Logout */}
            <div className="mt-4">
                <UserLogout />
            </div>
        </div>
    );
}
