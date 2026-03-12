import { getOutstandingCoinReport, getClassAttendanceReport } from "@/actions/report";
import ReportTabs from "./_components/ReportTabs";

export default async function ReportsPage() {
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [coinData, attendanceData] = await Promise.all([
        getOutstandingCoinReport(currentYear),
        getClassAttendanceReport(dateFrom, dateTo),
    ]);

    return (
        <div className="max-w-[1200px] mx-auto">
            <ReportTabs
                coinData={coinData}
                attendanceData={attendanceData}
            />
        </div>
    );
}
