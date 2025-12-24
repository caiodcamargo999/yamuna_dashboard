import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="h-10 w-64 bg-slate-800/50 rounded mb-6" />

            {/* Table Skeleton */}
            <div className="bg-[#0B0B1E]/60 border border-white/5 rounded-xl overflow-hidden p-6">
                {/* Table Header */}
                <div className="flex justify-between mb-8">
                    <div className="h-6 w-48 bg-white/5 rounded" />
                    <div className="h-6 w-24 bg-white/5 rounded" />
                </div>

                {/* Table Rows */}
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="h-12 bg-white/5 rounded w-full" />
                    ))}
                </div>
            </div>
        </div>
    )
}
