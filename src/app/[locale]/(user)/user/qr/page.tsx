import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { QrCode } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function UserQrPage() {
    const t = await getTranslations("UserQr");
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { qrCode: true, parentName: true },
    });

    if (!user) return null;

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-xl font-bold text-[#3d405b] mb-6">{t("title")}</h1>

            <div className="bg-white rounded-2xl p-8 border border-[#d1cce7]/20 shadow-sm text-center w-full max-w-xs">
                <div className="w-48 h-48 mx-auto bg-[#f4f1de]/50 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-[#d1cce7]/30">
                    <div className="text-center">
                        <QrCode size={64} className="text-[#81b29a] mx-auto mb-2" />
                        <p className="text-xs text-[#3d405b]/40 font-mono break-all">{user.qrCode}</p>
                    </div>
                </div>
                <p className="text-sm font-medium text-[#3d405b]/80">{user.parentName}</p>
                <p className="text-xs text-[#3d405b]/40 mt-1">
                    {t("instruction")}
                </p>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-[#3d405b]/40">
                    {t("footer1")}
                    <br />
                    {t("footer2")}
                </p>
            </div>
        </div>
    );
}
