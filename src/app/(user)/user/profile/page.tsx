import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { User, QrCode } from "lucide-react";
import UserLogout from "./UserLogout";
import ProfileEditForm from "./ProfileEditForm";

export default async function UserProfilePage() {
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { children: true },
    });

    if (!user) return <div className="p-4 text-center text-[#3d405b]/40">ไม่พบข้อมูล</div>;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold text-[#3d405b] mb-4">โปรไฟล์</h1>

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

            {/* Editable Profile + Password */}
            <ProfileEditForm user={JSON.parse(JSON.stringify(user))} />

            {/* Logout */}
            <div className="mt-4">
                <UserLogout />
            </div>
        </div>
    );
}
