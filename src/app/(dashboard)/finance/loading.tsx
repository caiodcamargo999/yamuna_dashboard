import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="p-6 space-y-8 w-full max-w-[1600px] mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="h-10 w-64 bg-slate-800/50 rounded mb-8" />

            {/* KPI Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-[120px] bg-[#0B0B1E]/60 rounded-2xl border border-white/5" />
                ))}
            </div>

            {/* Details Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px] bg-[#0B0B1E]/60 rounded-2xl border border-white/5" />
                <div className="h-[300px] bg-[#0B0B1E]/60 rounded-2xl border border-white/5" />
            </div>
        </div>
    )
}
