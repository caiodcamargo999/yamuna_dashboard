import { SkeletonSummaryCards } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="RFM - Análise de Clientes" />
            <main className="p-6 space-y-6 w-full max-w-[1600px] mx-auto animate-pulse">
                {/* Filters Skeleton */}
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-32 bg-white/5 rounded-lg" />
                    ))}
                </div>

                {/* Summary Cards Skeleton */}
                <SkeletonSummaryCards count={4} />

                {/* Table Skeleton */}
                <div className="bg-[#0B0B1E]/60 border border-white/5 rounded-xl overflow-hidden p-6">
                    <div className="h-6 w-48 bg-white/5 rounded mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-12 bg-white/5 rounded w-full" />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
