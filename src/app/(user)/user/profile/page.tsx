import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { User, Phone, Baby, QrCode } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import UserLogout from "./UserLogout";

export default async function UserProfilePage() {
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { children: true },
    });

    if (!user) return <div className="p-4 text-center text-slate-400">ไม่พบข้อมูล</div>;

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-4">โปรไฟล์</h1>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-4">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-blue-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 text-lg">{user.parentName}</h2>
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Phone size={14} />
                            {user.phone}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-3 p-3 bg-slate-50 rounded-xl">
                    <QrCode size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-600 font-mono">{user.qrCode}</span>
                </div>
            </div>

            {/* Children */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-4">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Baby size={18} className="text-pink-500" />
                    เด็กในครอบครัว ({user.children.length})
                </h3>
                <div className="space-y-2">
                    {user.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-sm font-medium text-slate-700">{child.name}</span>
                            <span className="text-xs text-slate-400">
                                {format(new Date(child.birthDate), "d MMM yyyy", { locale: th })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <UserLogout />
        </div>
    );
}
