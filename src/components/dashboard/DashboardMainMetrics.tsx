import { FunnelOverview } from "@/components/charts/FunnelOverview";
import { CustomerRetentionGroup, SalesRetentionGroup } from "@/components/dashboard/RetentionMetrics";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { GlassCard } from "@/components/ui/GlassCard";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

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

function getFunnelData(data: any) {
    // FUNNEL FALLBACK LOGIC
    // If GA4 fails (sessions=0) but we have sales, estimate funnel from sales
    let sessions = data.sessions || 0;
    let productsViewed = data.productsViewed || 0;
    let addToCarts = data.addToCarts || 0;
    let checkouts = data.checkouts || 0;
    const transactions = data.transactions || 0;

    if (sessions === 0 && transactions > 0) {
        console.log(`[Dashboard Metrics] ⚠️ GA4 Missing - Estimating Funnel from ${transactions} transactions`);
        // Reverse engineering funnel based on standard benchmarks
        sessions = Math.round(transactions / 0.016);
        checkouts = Math.round(transactions / 0.4);
        addToCarts = Math.round(checkouts / 0.3);
        productsViewed = Math.round(sessions * 2.5);
    }

    return [
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
}


interface KPIProps {
    dataPromise: Promise<any>;
    startDate: string;
    endDate: string;
}

export async function DashboardKPIs({ dataPromise, startDate = "30daysAgo", endDate = "today" }: KPIProps) {
    const data = await dataPromise;

    return (
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

                    {/* Streamed Retention Metrics */}
                    <SalesRetentionGroup startDate={startDate} endDate={endDate} />

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
                    <CustomerRetentionGroup startDate={startDate} endDate={endDate} />
                </div>
            </section>
        </div>
    );
}

export async function DashboardFunnel({ dataPromise }: { dataPromise: Promise<any> }) {

    const data = await dataPromise;
    const funnelData = getFunnelData(data);

    return (
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
    );
}
