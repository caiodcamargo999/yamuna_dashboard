import { Suspense } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Rocket } from "lucide-react";

// Component to load 6-month metrics asynchronously
async function SixMonthMetrics() {
    try {
        const { fetch6MonthMetrics } = await import("@/app/actions");
        const data6m = await fetch6MonthMetrics();

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard delay={11} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                            Faturamento 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 group-hover:scale-105 transition-transform origin-left">
                            <span className="text-lg text-slate-500 font-medium">R$ </span>
                            <AnimatedNumber value={data6m.revenue} format="decimal" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={12} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                            LTV 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 group-hover:scale-105 transition-transform origin-left">
                            <span className="text-lg text-slate-500 font-medium">R$ </span>
                            <AnimatedNumber value={data6m.ltv} format="decimal" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={13} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                            ROI 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 group-hover:scale-105 transition-transform origin-left">
                            <AnimatedNumber value={data6m.roi} format="decimal" />
                            <span className="text-sm text-slate-500 font-medium">x</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    } catch (error) {
        console.error("[SixMonthMetrics] Failed to fetch data:", error);
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard delay={11} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            Faturamento 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
                            <span className="text-lg text-slate-500 font-medium">R$ </span>
                            0,00
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={12} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            LTV 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
                            <span className="text-lg text-slate-500 font-medium">R$ </span>
                            0,00
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={13} className="flex flex-col justify-between h-[120px] group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            ROI 6 Meses
                        </span>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
                            0.00
                            <span className="text-sm text-slate-500 font-medium">x</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    }
}

// Loading skeleton for 6-month metrics
function SixMonthMetricsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <GlassCard key={i} delay={11 + i - 1} className="flex flex-col justify-between h-[120px]">
                    <div className="flex justify-between items-start">
                        <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse" />
                    </div>
                    <div className="mt-2">
                        <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}

// Main component with Suspense boundary
export function SixMonthMetricsSection() {
    return (
        <section className="relative">
            <div className="absolute left-1/2 -top-4 w-32 h-20 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4 ml-1">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                    <Rocket className="text-white w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Crescimento (6 Meses)</h3>
            </div>
            <Suspense fallback={<SixMonthMetricsSkeleton />}>
                <SixMonthMetrics />
            </Suspense>
        </section>
    );
}
