import { Header } from "@/components/layout/Header";
import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";
import { TrendingUp } from "lucide-react"; // Keeping TrendingUp if used in fallback or elsewhere, checked usage: DashboardFunnel uses it but page.tsx might not need it anymore. Actually page.tsx doesn't use it in this new version.
import { format, subDays, parseISO } from "date-fns";
import { DashboardKPIs, DashboardFunnel } from "@/components/dashboard/DashboardMainMetrics";
import { SixMonthMetricsSection } from "@/components/dashboard/SixMonthMetrics";
import { LastMonthSection } from "@/components/dashboard/LastMonthData";
import { SkeletonKPIRow, SkeletonFunnel } from "@/components/ui/Skeleton";

// Use ISR (Incremental Static Regeneration) for better performance
// Revalidate every 5 minutes - shows cached version instantly while updating in background
export const revalidate = 300; // 5 minutes

// Custom Skeleton for the KPI Section to match the 3-row layout
function KPISectionSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Row 1: Investment */}
            <div className="space-y-4">
                <SkeletonKPIRow cards={2} />
            </div>
            {/* Row 2: Sales */}
            <div className="space-y-4">
                <SkeletonKPIRow cards={4} />
            </div>
            {/* Row 3: Customers */}
            <div className="space-y-4">
                <SkeletonKPIRow cards={2} />
            </div>
        </div>
    );
}

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function DashboardPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    console.log(`[Dashboard] 🔍 Streaming started for ${startDate} to ${endDate}`);

    // START FETCHING (Non-blocking)
    // We pass this promise to the child components
    const dataPromise = fetchDashboardData(startDate, endDate);

    const displayStart = startDate === "30daysAgo"
        ? format(subDays(new Date(), 30), "dd/MM/yyyy")
        : format(parseISO(startDate), "dd/MM/yyyy");

    const displayEnd = endDate === "today"
        ? format(new Date(), "dd/MM/yyyy")
        : format(parseISO(endDate), "dd/MM/yyyy");

    return (
        <>
            <Header title="Check-in Loja Virtual" />
            <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto overflow-hidden relative">

                {/* Filter Badge - Renders Immediately */}
                <div className="flex items-center gap-2 mt-4 lg:-mt-4 mb-6 relative z-10">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-xs text-slate-300 bg-[#0B0B1E]/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
                        Período: <span className="text-sky-400 font-semibold">{displayStart} até {displayEnd}</span>
                    </span>
                </div>

                {/* Dashboard Grid */}
                <div className="space-y-10 relative z-10">
                    {/* Main KPIs (Suspended) */}
                    <Suspense fallback={<KPISectionSkeleton />}>
                        <DashboardKPIs
                            dataPromise={dataPromise}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </Suspense>

                    {/* Section 4: Growth & Long Term (Already Streamed Internally) */}
                    <SixMonthMetricsSection />
                </div>

                {/* Bottom Section: Funnel & Last Month */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4 relative z-10">
                    <Suspense fallback={<SkeletonFunnel />}>
                        <DashboardFunnel dataPromise={dataPromise} />
                    </Suspense>

                    <div className="space-y-6">
                        {/* Streamed Last Month Data (Already Streamed Internally) */}
                        <LastMonthSection />
                    </div>
                </div>
            </div>
        </>
    );
}


