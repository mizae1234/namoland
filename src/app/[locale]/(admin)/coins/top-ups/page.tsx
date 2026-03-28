import { getAllTopUps } from "@/actions/coin";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowLeft, Coins } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import TopUpActions from "./_components/TopUpActions";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    PENDING: { label: "รอดำเนินการ", className: "bg-amber-100 text-amber-700" },
    APPROVED: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-700" },
    REJECTED: { label: "ปฏิเสธ", className: "bg-red-100 text-red-700" },
};

export default async function TopUpsPage() {
    const topUps = await getAllTopUps();
    const pendingCount = topUps.filter((t) => t.status === "PENDING").length;

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <Link href="/coins" className="p-2 hover:bg-[#d1cce7]/15 rounded-xl transition-colors">
                    <ArrowLeft size={20} className="text-[#3d405b]/70" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#3d405b]">คำขอเติมเหรียญ</h1>
                    <p className="text-[#3d405b]/50 mt-0.5 text-sm">
                        {pendingCount > 0 ? `มี ${pendingCount} รายการรอดำเนินการ` : "ไม่มีรายการรอดำเนินการ"}
                    </p>
                </div>
            </div>

            <Card padding={false}>
                <div className="p-6 border-b border-[#d1cce7]/20">
                    <h2 className="font-semibold text-[#3d405b] flex items-center gap-2">
                        <Coins size={18} className="text-amber-500" />
                        รายการทั้งหมด
                    </h2>
                </div>
                <div className="divide-y divide-[#d1cce7]/15">
                    {topUps.length === 0 ? (
                        <div className="p-6 text-center text-[#3d405b]/40 text-sm">ยังไม่มีคำขอเติมเหรียญ</div>
                    ) : (
                        topUps.map((req) => {
                            const status = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
                            return (
                                <div key={req.id} className="px-6 py-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-[#3d405b]/80">{req.user.parentName}</p>
                                            <p className="text-sm text-[#3d405b]/50">{req.user.phone}</p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[#3d405b]/40 mb-2">
                                        <span>{req.coins} เหรียญ</span>
                                        <span>฿{Number(req.amount).toLocaleString()}</span>
                                        <span>{format(new Date(req.createdAt), "d MMM yy HH:mm", { locale: th })}</span>
                                    </div>
                                    {req.slipNote && (
                                        <p className="text-xs text-[#3d405b]/50 bg-[#f4f1de]/50 px-3 py-2 rounded-lg mb-2">
                                            💬 {req.slipNote}
                                        </p>
                                    )}
                                    {req.adminNote && (
                                        <p className="text-xs text-[#3d405b]/50 bg-amber-50 px-3 py-2 rounded-lg mb-2">
                                            📝 {req.adminNote}
                                        </p>
                                    )}
                                    {req.status === "PENDING" && (
                                        <div className="mt-2">
                                            <TopUpActions requestId={req.id} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
}
