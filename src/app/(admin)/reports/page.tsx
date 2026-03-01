import { getOutstandingCoinReport } from "@/actions/report";
import { Coins } from "lucide-react";
import OutstandingCoinTable from "./_components/OutstandingCoinTable";

export default async function ReportsPage() {
    const currentYear = new Date().getFullYear();
    const data = await getOutstandingCoinReport(currentYear);

    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Coins size={24} className="text-amber-500" />
                    Outstanding Coin
                </h1>
                <p className="text-slate-500 mt-1">
                    สรุปยอดเหรียญคงเหลือในระบบ แยกตามเดือน
                </p>
            </div>

            <OutstandingCoinTable initialData={data} />
        </div>
    );
}
