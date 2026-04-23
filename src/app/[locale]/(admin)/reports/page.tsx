import { getOutstandingCoinReport, getClassAttendanceReport } from "@/actions/report";
import ReportTabs from "./_components/ReportTabs";
import { auth } from "@/lib/auth";

export default async function ReportsPage() {
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [coinData, attendanceData, session] = await Promise.all([
        getOutstandingCoinReport(currentYear),
        getClassAttendanceReport(dateFrom, dateTo),
        auth(),
    ]);

    return (
        <div className="max-w-[1200px] mx-auto">
            <ReportTabs
                coinData={coinData}
                attendanceData={attendanceData}
                userRole={session?.user?.role || "ADMIN"}
            />
        </div>
    );
}
