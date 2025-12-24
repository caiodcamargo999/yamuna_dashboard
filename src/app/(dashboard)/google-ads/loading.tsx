import { SkeletonSummaryCards } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Google Ads (via GA4)" />
            <main className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-pulse">
                {/* Intro Skeleton */}
                <div className="h-20 w-full bg-blue-900/10 rounded-lg border border-blue-800/20" />

                {/* KPI Skeleton */}
                <SkeletonSummaryCards count={4} />

                {/* Table Skeleton */}
                <div className="bg-[#0B0B1E]/60 border border-white/5 rounded-xl overflow-hidden p-6">
                    <div className="h-6 w-48 bg-white/5 rounded mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-white/5 rounded w-full" />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
