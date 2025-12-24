import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="h-8 w-64 bg-slate-800/50 rounded mb-8" />

            {/* Goal Editor Skeleton */}
            <div className="h-48 w-full bg-[#0B0B1E]/60 rounded-2xl border border-white/5" />

            {/* Visualization Skeleton */}
            <div className="h-[500px] w-full bg-[#0B0B1E]/60 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4">
                <div className="w-[80%] h-20 bg-slate-800/20 rounded-xl" />
                <div className="w-[60%] h-20 bg-slate-800/20 rounded-xl" />
                <div className="w-[40%] h-20 bg-slate-800/20 rounded-xl" />
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-[#0B0B1E]/60 rounded-2xl border border-white/5" />
                ))}
            </div>
        </div>
    )
}
