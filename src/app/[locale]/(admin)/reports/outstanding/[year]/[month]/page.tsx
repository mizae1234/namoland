import { getOutstandingCoinDetail } from "@/actions/report";
import { notFound } from "next/navigation";
import OutstandingCoinDetail from "./_components/OutstandingCoinDetail";

export default async function OutstandingDetailPage({
    params,
}: {
    params: Promise<{ year: string; month: string; locale: string }>;
}) {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr);

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        notFound();
    }

    const data = await getOutstandingCoinDetail(year, monthIndex);

    return (
        <div className="max-w-[1200px] mx-auto">
            <OutstandingCoinDetail data={data} />
        </div>
    );
}
