import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { QrCode } from "lucide-react";

export default async function UserQrPage() {
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { qrCode: true, parentName: true },
    });

    if (!user) return null;

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold text-slate-800 mb-6">QR Code ของฉัน</h1>

            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center w-full max-w-xs">
                <div className="w-48 h-48 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
                    <div className="text-center">
                        <QrCode size={64} className="text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-mono break-all">{user.qrCode}</p>
                    </div>
                </div>
                <p className="text-sm font-medium text-slate-700">{user.parentName}</p>
                <p className="text-xs text-slate-400 mt-1">
                    แสดง QR Code นี้ให้พนักงานที่ร้าน
                </p>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                    QR Code นี้ใช้สำหรับยืม-คืนหนังสือ
                    <br />
                    และตรวจสอบเหรียญที่ร้าน
                </p>
            </div>
        </div>
    );
}
