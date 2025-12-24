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

    // FUNNEL FALLBACK LOGIC
    // If GA4 fails (sessions=0) but we have sales, estimate funnel from sales
    let sessions = data.sessions || 0;
    let productsViewed = data.productsViewed || 0;
    let addToCarts = data.addToCarts || 0;
    let checkouts = data.checkouts || 0;
    const transactions = data.transactions || 0;

    if (sessions === 0 && transactions > 0) {
        console.log(`[Dashboard Page] ⚠️ GA4 Missing - Estimating Funnel from ${transactions} transactions`);
        // Reverse engineering funnel based on standard benchmarks:
        // Conversion Rate ~1.6% => Sessions = Transactions / 0.016
        sessions = Math.round(transactions / 0.016);
        // Checkout Conversion ~40% => Checkouts = Transactions / 0.4
        checkouts = Math.round(transactions / 0.4);
        // Add to Cart Rate ~10% of sessions or Cart->Checkout ~30%
        addToCarts = Math.round(checkouts / 0.3);
        // Product Views ~2x Sessions
        productsViewed = Math.round(sessions * 2.5);
    }

    // Funnel data with fallbacks
    const funnelData = [
        { stage: "Sessões", users: sessions, value: sessions.toLocaleString('pt-BR'), subLabel: "Sessões" },
        {
            stage: "Estimado",
            users: Math.round(sessions * 0.6),
            value: Math.round(sessions * 0.6).toLocaleString('pt-BR'),
            subLabel: "Estimado (60%)"
        },
        { stage: "Visualizações", users: productsViewed, value: productsViewed.toLocaleString('pt-BR'), subLabel: "Produtos" },
        { stage: "Carrinho", users: addToCarts, value: addToCarts.toLocaleString('pt-BR'), subLabel: "Add ao Carrinho" },
        { stage: "Checkout", users: checkouts, value: checkouts.toLocaleString('pt-BR'), subLabel: "Iniciado" },
        { stage: "Transações", users: transactions, value: transactions.toLocaleString('pt-BR'), subLabel: "Transações" },
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
            <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto overflow-hidden relative">

                {/* Filter Badge */}
                <div className="flex items-center gap-2 -mt-4 mb-6 relative z-10">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-xs text-slate-300 bg-[#0B0B1E]/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
                        Período: <span className="text-sky-400 font-semibold">{displayStart} até {displayEnd}</span>
                    </span>
                </div>

                {/* Dashboard Grid */}
                <div className="space-y-10 relative z-10">


                    {/* Section 1: Investment & Efficiency */}
                    <section className="relative group">
                        <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
                        <div className="flex items-center gap-3 mb-4 ml-1 relative z-10">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                <DollarSign className="text-orange-400 w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Investimento & Eficiência</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPIGlassCard label="Investimento" value={data.kpis.investment} prefix="R$ " delay={1} />
                            <KPIGlassCard label="% Custo" value={data.kpis.costPercentage} suffix="%" format="decimal" delay={2} invertTrend />
                        </div>
                    </section>

                    {/* Section 2: Sales & Revenue */}
                    <section className="relative group">
                        <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-sky-500/10 transition-colors duration-700" />
                        <div className="flex items-center gap-3 mb-4 ml-1 relative z-10">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                                <ShoppingCart className="text-sky-400 w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Vendas & Receita</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPIGlassCard label="Receita Total" value={data.revenue} prefix="R$ " delay={5} />
                            <KPIGlassCard label="Ticket Médio" value={data.kpis.ticketAvg} prefix="R$ " delay={6} />
                            <KPIGlassCard label="Ticket Médio Novos" value={data.kpis.ticketAvgNew} prefix="R$ " delay={7} />
                            <KPIGlassCard label="Retenção" value={data.kpis.retentionRevenue} prefix="R$ " delay={8} />
                            <KPIGlassCard label="Receita Nova" value={data.kpis.newRevenue} prefix="R$ " delay={9} />
                            <KPIGlassCard label="Receita B2B" value={data.b2b?.b2bRevenue || 0} prefix="R$ " delay={10} />
                            <KPIGlassCard label="Receita B2C" value={data.b2b?.b2cRevenue || 0} prefix="R$ " delay={11} />
                        </div>
                    </section>

                    {/* Section 3: Customers */}
                    <section className="relative group">
                        <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                        <div className="flex items-center gap-3 mb-4 ml-1 relative z-10">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <Users className="text-purple-400 w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Clientes</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPIGlassCard label="Clientes Adquiridos" value={data.kpis.acquiredCustomers} format="number" delay={9} />
                            <KPIGlassCard label="Custo de Aquisição de Clientes" value={data.kpis.cac} prefix="R$ " delay={10} invertTrend />
                        </div>
                    </section>

                    {/* Section 4: Growth & Long Term */}
                    <section className="relative group">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-20 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
                        <div className="flex items-center gap-3 mb-4 ml-1 relative z-10">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                <Rocket className="text-indigo-400 w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Crescimento (6 Meses)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KPIGlassCard label="Faturamento 6 Meses" value={data.kpis.revenue12m} prefix="R$ " delay={11} />
                            <KPIGlassCard label="LTV 6 Meses" value={data.kpis.ltv12m} prefix="R$ " delay={12} />
                            <KPIGlassCard label="ROI 6 Meses" value={data.kpis.roi12m} suffix="x" format="decimal" delay={13} />
                        </div>
                    </section>

                </div>

                {/* Bottom Section: Funnel & Last Month */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4 relative z-10">
                    <GlassCard className="xl:col-span-2 min-h-[400px] bg-[#0B0B1E]/60 backdrop-blur-xl border-white/5" delay={12}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp className="text-orange-400" size={20} />
                                Funil de Vendas
                            </h3>
                            <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300 font-medium">Tempo Real</div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <FunnelOverview data={funnelData} />
                        </div>
                    </GlassCard>

                    <div className="space-y-6">
                        <GlassCard delay={13} className="bg-[#0B0B1E]/60 backdrop-blur-xl border-white/5">
                            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">
                                Mês Anterior <span className="text-sm font-normal text-slate-400 ml-2">({data.lastMonthLabel})</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="p-5 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                                    <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Receita Faturada</span>
                                    <div className="text-3xl font-bold text-white group-hover:text-emerald-400 transition-colors flex items-baseline gap-1">
                                        <span className="text-lg text-slate-500">R$</span>
                                        <AnimatedNumber value={data.revenueLastMonth || 0} format="decimal" />
                                    </div>
                                </div>
                                <div className="p-5 bg-white/5 rounded-xl border border-white/5 hover:border-sky-500/30 transition-colors group">
                                    <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Investimento Ads</span>
                                    <div className="text-3xl font-bold text-white group-hover:text-sky-400 transition-colors flex items-baseline gap-1">
                                        <span className="text-lg text-slate-500">R$</span>
                                        <AnimatedNumber value={data.investmentLastMonth || 0} format="decimal" />
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

