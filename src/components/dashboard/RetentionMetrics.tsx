import { Suspense } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Users, AlertCircle } from "lucide-react";
import { fetchRetentionMetrics } from "@/app/actions";

// Helper for GlassCard reuse
function KPIGlassCard({
    label,
    value,
    prefix = "",
    suffix = "",
    trend,
    invertTrend = false,
    format = 'currency',
    delay = 0,
    className = ""
}: any) {
    const isPositive = trend > 0;
    const isGood = invertTrend ? !isPositive : isPositive;

    return (
        <GlassCard delay={delay} className={`flex flex-col justify-between h-[120px] group ${className}`}>
            <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                    {label}
                </span>
            </div>

            <div className="mt-2">
                <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 group-hover:scale-105 transition-transform origin-left">
                    {prefix && <span className="text-lg text-slate-500 font-medium">{prefix}</span>}
                    <AnimatedNumber value={value} format={format} />
                    {suffix && <span className="text-sm text-slate-500 font-medium">{suffix}</span>}
                </div>
            </div>
        </GlassCard>
    );
}

// Skeleton for loading state
function MetricSkeleton({ delay = 0 }) {
    return (
        <GlassCard delay={delay} className="flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
                <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse" />
            </div>
            <div className="mt-2">
                <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
            </div>
        </GlassCard>
    );
}

async function SalesRetentionData({ startDate, endDate }: { startDate: string, endDate: string }) {
    try {
        // Fetch data (streaming)
        const data = await fetchRetentionMetrics(startDate, endDate);

        return (
            <>
                <KPIGlassCard label="Ticket Médio Novos" value={data.ticketAvgNew} prefix="R$ " delay={7} />
                <KPIGlassCard label="Retenção" value={data.retentionRevenue} prefix="R$ " delay={8} />
                <KPIGlassCard label="Receita Nova" value={data.newRevenue} prefix="R$ " delay={9} />
            </>
        );
    } catch (error) {
        console.error("[SalesRetentionData] Failed to fetch data:", error);
        return (
            <>
                <KPIGlassCard label="Ticket Médio Novos" value={0} prefix="R$ " delay={7} />
                <KPIGlassCard label="Retenção" value={0} prefix="R$ " delay={8} />
                <KPIGlassCard label="Receita Nova" value={0} prefix="R$ " delay={9} />
            </>
        );
    }
}

async function CustomersRetentionData({ startDate, endDate }: { startDate: string, endDate: string }) {
    try {
        // Fetch data (streaming)
        const data = await fetchRetentionMetrics(startDate, endDate);

        return (
            <>
                <KPIGlassCard label="Clientes Adquiridos" value={data.acquiredCustomers} format="number" delay={9} />
                <KPIGlassCard label="Custo de Aquisição de Clientes" value={data.cac} prefix="R$ " delay={10} invertTrend />
            </>
        );
    } catch (error) {
        console.error("[CustomersRetentionData] Failed to fetch data:", error);
        return (
            <>
                <KPIGlassCard label="Clientes Adquiridos" value={0} format="number" delay={9} />
                <KPIGlassCard label="Custo de Aquisição (CAC)" value={0} prefix="R$ " delay={10} invertTrend />
            </>
        );
    }
}

// --- EXPORTED COMPONENTS ---

export function SalesRetentionGroup({ startDate, endDate }: { startDate: string, endDate: string }) {
    return (
        <Suspense fallback={
            <>
                <MetricSkeleton delay={7} />
                <MetricSkeleton delay={8} />
                <MetricSkeleton delay={9} />
            </>
        }>
            <SalesRetentionData startDate={startDate} endDate={endDate} />
        </Suspense>
    );
}

export function CustomerRetentionGroup({ startDate, endDate }: { startDate: string, endDate: string }) {
    return (
        <Suspense fallback={
            <>
                <MetricSkeleton delay={9} />
                <MetricSkeleton delay={10} />
            </>
        }>
            <CustomersRetentionData startDate={startDate} endDate={endDate} />
        </Suspense>
    );
}
