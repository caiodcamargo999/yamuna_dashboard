import { Suspense } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

// Component to load last month data asynchronously
async function LastMonthData() {
    const { fetchLastMonthData } = await import("@/app/actions");
    const lastMonthData = await fetchLastMonthData();

    return (
        <GlassCard delay={13}>
            <h3 className="text-lg font-semibold text-white mb-4">Mês Anterior ({lastMonthData.label})</h3>
            <div className="space-y-6">
                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                    <span className="text-sm text-slate-400 block mb-1">Receita Faturada</span>
                    <div className="text-2xl font-bold text-emerald-400">
                        R$ <AnimatedNumber value={lastMonthData.revenue || 0} format="decimal" />
                    </div>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                    <span className="text-sm text-slate-400 block mb-1">Investimento Ads</span>
                    <div className="text-2xl font-bold text-white">
                        R$ <AnimatedNumber value={lastMonthData.investment || 0} format="decimal" />
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

// Loading skeleton
function LastMonthDataSkeleton() {
    return (
        <GlassCard delay={13}>
            <div className="h-6 w-48 bg-slate-800/50 rounded animate-pulse mb-4" />
            <div className="space-y-6">
                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                    <div className="h-3 w-24 bg-slate-800/50 rounded animate-pulse mb-2" />
                    <div className="h-8 w-32 bg-slate-700/50 rounded animate-pulse" />
                </div>
                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                    <div className="h-3 w-24 bg-slate-800/50 rounded animate-pulse mb-2" />
                    <div className="h-8 w-32 bg-slate-700/50 rounded animate-pulse" />
                </div>
            </div>
        </GlassCard>
    );
}

// Main component with Suspense boundary
export function LastMonthSection() {
    return (
        <Suspense fallback={<LastMonthDataSkeleton />}>
            <LastMonthData />
        </Suspense>
    );
}
