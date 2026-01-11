import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";
import { DashboardKPIs, DashboardFunnel } from "@/components/dashboard/DashboardMainMetrics";
import { SixMonthMetricsSection } from "@/components/dashboard/SixMonthMetrics";
import { LastMonthSection } from "@/components/dashboard/LastMonthData";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChartAreaInteractive } from "@/components/chart-area-interactive"; // Import the new chart

export const revalidate = 300;
export const maxDuration = 300;

function KPISkeleton({ delay = 0 }) {
    return (
        <Card className="h-[120px]">
            <CardHeader className="space-y-2">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
            </CardHeader>
        </Card>
    );
}

function KPISectionSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPISkeleton />
                <KPISkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPISkeleton />
                <KPISkeleton />
            </div>
        </div>
    );
}

function FunnelSkeleton() {
    return (
        <Card className="xl:col-span-4 min-h-[400px]">
            <CardHeader>
                <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full bg-muted/50 rounded animate-pulse" />
            </CardContent>
        </Card>
    )
}

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function DashboardPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    const dataPromise = fetchDashboardData(startDate, endDate);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between py-6">
                <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <DateRangeFilter />
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-8">
                {/* Main KPIs (Suspended) */}
                <Suspense fallback={<KPISectionSkeleton />}>
                    <DashboardKPIs
                        dataPromise={dataPromise}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </Suspense>

                {/* New Interactive Chart Section */}
                <section>
                    <ChartAreaInteractive />
                </section>

                {/* Section 4: Growth */}
                <SixMonthMetricsSection />

                {/* Bottom Charts */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4">
                        <Suspense fallback={<FunnelSkeleton />}>
                            <DashboardFunnel dataPromise={dataPromise} />
                        </Suspense>
                    </div>
                    <div className="col-span-3">
                        <LastMonthSection />
                    </div>
                </div>
            </div>
        </div>
    )
}
