import { Header } from "@/components/layout/Header";
import { ArrowUp, ArrowDown, DollarSign, Users, RefreshCw, ShoppingCart } from "lucide-react";
import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function FinancePage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    console.log(`[Finance Page] 🔍 Filtro recebido: start=${startDate}, end=${endDate}`);

    const data = await fetchDashboardData(startDate, endDate);

    console.log(`[Finance Page] 📊 Dados retornados:`);
    console.log(`  - Revenue: R$ ${data.revenue}`);
    console.log(`  - Transactions: ${data.transactions}`);

    // Calculated KPIs
    const ticketMedio = data.transactions > 0 ? data.revenue / data.transactions : 0;
    const cac = data.transactions > 0 ? data.investment / data.transactions : 0;
    const roi = data.investment > 0 ? (data.revenue - data.investment) / data.investment : 0;

    const kpiData = [
        { label: "Receita Faturada", value: data.revenue, icon: DollarSign, format: 'currency' },
        { label: "Investimento Ads", value: data.investment, icon: DollarSign, format: 'currency' },
        { label: "Ticket Médio", value: ticketMedio, icon: ShoppingCart, format: 'currency' },
        { label: "ROI (ROAS Geral)", value: roi, icon: RefreshCw, format: 'decimal', suffix: 'x' },
        { label: "Transações", value: data.transactions, icon: Users, format: 'number' },
    ];

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Indicadores Financeiros (Real Time)" />
            </Suspense>
            <main className="p-6 space-y-8 overflow-y-auto w-full max-w-[1600px] mx-auto">

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10">
                    <div className="absolute top-[-100px] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

                    {kpiData.map((kpi, idx) => (
                        <FinanceKpiCard key={idx} {...kpi} delay={idx} />
                    ))}
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard delay={5} className="p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-sky-400" />
                            Eficiência de Pagamentos
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-slate-400">Checkout Iniciado</span>
                                <span className="text-white font-mono text-lg font-medium">
                                    <AnimatedNumber value={data.checkouts} />
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-slate-400">Transações Concluídas</span>
                                <span className="text-white font-mono text-lg font-medium">
                                    <AnimatedNumber value={data.transactions} />
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-400">Taxa de Conversão</span>
                                <div className="text-emerald-400 font-mono font-bold text-xl">
                                    <AnimatedNumber
                                        value={data.checkouts > 0 ? ((data.transactions / data.checkouts) * 100) : 0}
                                        format="decimal"
                                    />%
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard delay={6} className="p-6 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                        <h3 className="text-lg font-bold text-white mb-4 relative z-10">Custo por Aquisição (Estimado)</h3>
                        <div className="flex items-center justify-center h-[200px] flex-col relative z-10">
                            <span className="text-5xl font-bold text-white tracking-tighter">
                                <span className="text-2xl text-emerald-400 mr-1">R$</span>
                                <AnimatedNumber value={cac} format="decimal" />
                            </span>
                            <span className="text-slate-400 text-sm mt-4 bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">
                                Investimento Total / Transações
                            </span>
                        </div>
                    </GlassCard>
                </div>

            </main>
        </>
    );
}

function FinanceKpiCard({ label, value, icon: Icon, format, suffix = "", delay }: any) {
    return (
        <GlassCard delay={delay} className="flex flex-col justify-between h-[120px] group hover:border-sky-500/30">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide group-hover:text-sky-200 transition-colors">{label}</span>
                {Icon && <Icon className="w-4 h-4 text-sky-500/70 group-hover:text-sky-400 transition-colors" />}
            </div>
            <div className="text-center mt-2 flex flex-col items-start">
                <p className="text-2xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform origin-left">
                    <span className="mr-1">{format === 'currency' ? 'R$ ' : ''}</span>
                    <AnimatedNumber value={value} format={format === 'currency' ? 'decimal' : format} />
                    {suffix && <span className="ml-1 text-lg text-slate-500">{suffix}</span>}
                </p>
            </div>
        </GlassCard>
    )
}

