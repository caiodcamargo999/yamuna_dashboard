import { Header } from "@/components/layout/Header";
import { FunnelOverview } from "@/components/charts/FunnelOverview";
import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";
import { DollarSign, ShoppingCart, Users, Rocket, TrendingUp, TrendingDown } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

// Force dynamic rendering to respect date filters
export const dynamic = 'force-dynamic';


// Helper Component for the Premium Glass Cards
function KPIGlassCard({
    label,
    value,
    prefix = "",
    suffix = "",
    trend,
    invertTrend = false,
    format = 'currency',
    delay = 0
}: any) {
    const isPositive = trend > 0;
    const isGood = invertTrend ? !isPositive : isPositive;

    // Determine trend color
    const trendColor = isGood ? "text-emerald-400" : "text-rose-400";
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <GlassCard delay={delay} className="flex flex-col justify-between h-[120px] group">
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

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function DashboardPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    console.log(`[Dashboard] 🔍 Fetching data from ${startDate} to ${endDate}`);

    // Fetch real data on server side
    const data = await fetchDashboardData(startDate, endDate);

    // Funnel data 
    const funnelData = [
        { stage: "Sessões", users: data.sessions, value: data.sessions.toLocaleString('pt-BR'), subLabel: "Sessões" },
        {
            stage: "Estimado",
            users: Math.round(data.sessions * 0.6),
            value: Math.round(data.sessions * 0.6).toLocaleString('pt-BR'),
            subLabel: "Estimado (60%)"
        },
        { stage: "Visualizações", users: data.productsViewed, value: data.productsViewed.toLocaleString('pt-BR'), subLabel: "Produtos" },
        { stage: "Carrinho", users: data.addToCarts, value: data.addToCarts.toLocaleString('pt-BR'), subLabel: "Add ao Carrinho" },
        { stage: "Checkout", users: data.checkouts, value: data.checkouts.toLocaleString('pt-BR'), subLabel: "Iniciado" },
        { stage: "Transações", users: data.transactions, value: data.transactions.toLocaleString('pt-BR'), subLabel: "Transações" },
    ];

    const displayStart = startDate === "30daysAgo"
        ? format(subDays(new Date(), 30), "dd/MM/yyyy")
        : format(parseISO(startDate), "dd/MM/yyyy");

    const displayEnd = endDate === "today"
        ? format(new Date(), "dd/MM/yyyy")
        : format(parseISO(endDate), "dd/MM/yyyy");

    return (
        <>
            <Header title="Check-in Loja Virtual" />
            <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

                {/* Filter Badge */}
                <div className="flex items-center gap-2 -mt-4 mb-6">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm">
                        Período: <span className="text-sky-400 font-semibold">{displayStart} até {displayEnd}</span>
                    </span>
                </div>

                {/* Dashboard Grid */}
                <div className="space-y-10">

                    {/* Section 1: Investment & Efficiency */}
                    <section className="relative">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
                                <DollarSign className="text-white w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Investimento & Eficiência</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPIGlassCard label="Investimento Total" value={data.kpis.investment} prefix="R$ " delay={1} />
                            <KPIGlassCard label="% Custo sobre Venda" value={data.kpis.costPercentage} suffix="%" format="decimal" delay={2} invertTrend />
                            <KPIGlassCard label="Custo por Aquisição (CAC)" value={data.kpis.cac} prefix="R$ " delay={3} invertTrend />
                            <KPIGlassCard label="ROI (ROAS Geral)" value={(data.kpis.investment > 0 ? (data.revenue / data.kpis.investment) : 0)} suffix="x" format="decimal" delay={4} />
                        </div>
                    </section>

                    {/* Section 2: Sales & Revenue */}
                    <section className="relative">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/20">
                                <ShoppingCart className="text-white w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Vendas & Receita</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPIGlassCard label="Receita Total" value={data.revenue} prefix="R$ " delay={5} />
                            <KPIGlassCard label="Ticket Médio" value={data.kpis.ticketAvg} prefix="R$ " delay={6} />
                            <KPIGlassCard label="Receita Retenção (Est.)" value={data.kpis.retentionRevenue} prefix="R$ " delay={7} />
                            <KPIGlassCard label="Receita Novos (Est.)" value={data.kpis.newRevenue} prefix="R$ " delay={8} />
                        </div>
                    </section>

                    {/* Section 3: Growth & Long Term */}
                    <section className="relative">
                        <div className="absolute left-1/2 -top-4 w-32 h-20 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-2 mb-4 ml-1">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                                <Rocket className="text-white w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Crescimento (12 Meses)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KPIGlassCard label="Faturamento 12M" value={data.kpis.revenue12m} prefix="R$ " delay={9} />
                            <KPIGlassCard label="LTV Estimado 12M" value={data.kpis.ltv12m} prefix="R$ " delay={10} />
                            <KPIGlassCard label="ROI 12 Meses" value={data.kpis.roi12m} suffix="%" format="decimal" delay={11} />
                        </div>
                    </section>

                </div>

                {/* Bottom Section: Funnel & Last Month */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
                    <GlassCard className="xl:col-span-2 min-h-[400px]" delay={12}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Funil de Vendas</h3>
                            <div className="px-2 py-1 bg-white/5 rounded text-xs text-slate-400">Tempo Real</div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <FunnelOverview data={funnelData} />
                        </div>
                    </GlassCard>

                    <div className="space-y-6">
                        <GlassCard delay={13}>
                            <h3 className="text-lg font-semibold text-white mb-4">Mês Anterior ({data.lastMonthLabel})</h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                                    <span className="text-sm text-slate-400 block mb-1">Receita Faturada</span>
                                    <div className="text-2xl font-bold text-emerald-400">
                                        R$ <AnimatedNumber value={data.revenueLastMonth || 0} format="decimal" />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-950/40 rounded-lg border border-white/5">
                                    <span className="text-sm text-slate-400 block mb-1">Investimento Ads</span>
                                    <div className="text-2xl font-bold text-white">
                                        R$ <AnimatedNumber value={data.investmentLastMonth || 0} format="decimal" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </>
    );
}

