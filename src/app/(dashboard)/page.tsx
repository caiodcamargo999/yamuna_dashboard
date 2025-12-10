import { Header } from "@/components/layout/Header";
import { FunnelOverview } from "@/components/charts/FunnelOverview";
import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";
import { DollarSign, ShoppingCart, Users, Rocket } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cache data for 60 seconds to improve performance
export const revalidate = 60;

// Helper Component for the Cards
function KPI_Card({ label, value, prefix = "", suffix = "", trend, invertTrend = false, isCurrency = true, variant = "default" }: any) {
    const formattedValue = isCurrency
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);

    // If prefix/suffix is manual but we want currency formatting, we might just strip the currency symbol from Intl?
    // Let's just use the formattedValue if isCurrency is true, ignoring manual prefix if it doubles up.
    // Actually, for consistency let's just stick to a simple formatted display.
    const displayValue = isCurrency ? formattedValue : `${prefix}${formattedValue}${suffix}`;

    const isPositive = trend > 0;
    const isGood = invertTrend ? !isPositive : isPositive; // If invert, positive trend is BAD (e.g. Cost)

    // Correction: User image shows Cost increasing is Green (Good)? Maybe it represents scale?
    // Let's stick to standard business logic: Revenue Up = Good (Green), Cost Up = Bad (Red) unless specifically desired otherwise.
    // The image shows Investimento +1.0% (Green). So Spending More is viewed as Green (Scaling).
    // % Custo +4.3% (Green).
    // CAC -15% (Green).
    // OK, so Green always means "Trend is Green" visually, but mathematically we should care.
    // The image shows pure Green for Up, Red for Down regardless of metric type?
    // Cost % Up being Green is weird. Let's look closer.
    // % Custo +4.3% is GREEN arrow. 
    // Ticket Medio -6.8% is RED arrow.
    // Retention -12.2% is RED arrow.
    // So Up = Green, Down = Red seems to be the visual rule used in the mockup, regardless of meaning.
    // EXCEPT CAC -15.0% is GREEN. Wait.
    // CAC going DOWN is GOOD. So Green.
    // Ticket Medio going DOWN is BAD. So Red.
    // So it IS semantic colors.

    const colorClass = isGood ? "text-emerald-400" : "text-red-400";
    const arrow = isPositive ? "⬆" : "⬇";

    const bgClass = variant === "dark" ? "bg-slate-950 border-slate-900" : "bg-slate-900 border-slate-800";

    return (
        <div className={`p-4 rounded-xl border ${bgClass} flex flex-col justify-between h-[110px]`}>
            <span className="text-xs text-slate-400 font-medium">{label}</span>
            <div className="mt-1">
                <p className="text-xl font-bold text-white tracking-tight">
                    {displayValue}
                </p>
                {trend !== 0 && (
                    <span className={`text-[10px] font-semibold mt-1 block ${colorClass}`}>
                        {arrow} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
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

    // Hardcoded goals/projections since we don't have a backend DB for user settings yet
    const goal = 0;
    const projected = 0;
    // investment comes from GA4 now (advertiserAdCost)

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

    // Calculate display strings for Filter Status
    const displayStart = startDate === "30daysAgo"
        ? format(subDays(new Date(), 30), "dd/MM/yyyy")
        : format(parseISO(startDate), "dd/MM/yyyy");

    const displayEnd = endDate === "today"
        ? format(new Date(), "dd/MM/yyyy")
        : format(parseISO(endDate), "dd/MM/yyyy");

    return (
        <>
            <Header title="Check-in Loja Virtual" />
            <div className="p-4 lg:p-8 space-y-6">

                {/* Active Filter Indicator */}
                <div className="text-xs text-slate-400 -mt-4 mb-4">
                    Filtro Ativo: <span className="text-indigo-400 font-medium">{displayStart} até {displayEnd}</span>
                </div>

                {/* Custom KPI Dashboard */}
                <div className="space-y-8">

                    {/* Row 1: Cost/Investment */}
                    <div className="relative">
                        <div className="absolute -top-3 left-6 z-10 bg-orange-500 rounded-full p-1.5 shadow-lg shadow-orange-900/20">
                            <DollarSign className="text-white w-4 h-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPI_Card label="Investimento" value={data.kpis.investment} trend={0} prefix="R$ " />
                            <KPI_Card label="% Custo" value={data.kpis.costPercentage} suffix="%" trend={0} isCurrency={false} />
                        </div>
                    </div>

                    {/* Row 2: Sales */}
                    <div className="relative">
                        <div className="absolute -top-3 left-6 z-10 bg-orange-500 rounded-full p-1.5 shadow-lg shadow-orange-900/20">
                            <ShoppingCart className="text-white w-4 h-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <KPI_Card label="Ticket Médio" value={data.kpis.ticketAvg} trend={0} prefix="R$ " />
                            <KPI_Card label="Ticket Médio Novos Clientes" value={data.kpis.ticketAvgNew} trend={0} prefix="R$ " />
                            <KPI_Card label="Retenção" value={data.kpis.retentionRevenue} trend={0} prefix="R$ " />
                            <KPI_Card label="Receita Nova" value={data.kpis.newRevenue} trend={0} prefix="R$ " />
                        </div>
                    </div>

                    {/* Row 3: Customers */}
                    <div className="relative">
                        <div className="absolute -top-3 left-6 z-10 bg-orange-500 rounded-full p-1.5 shadow-lg shadow-orange-900/20">
                            <Users className="text-white w-4 h-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <KPI_Card label="Clientes Adquiridos" value={data.kpis.acquiredCustomers} trend={0} isCurrency={false} />
                            <KPI_Card label="Custo de Aquisição (CAC)" value={data.kpis.cac} trend={0} prefix="R$ " />
                        </div>
                    </div>

                    {/* Row 4: Long Term (12 Months) */}
                    <div className="relative">
                        <div className="absolute -top-3 left-6 z-10 bg-orange-500 rounded-full p-1.5 shadow-lg shadow-orange-900/20">
                            <Rocket className="text-white w-4 h-4" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KPI_Card label="Faturamento 12 Meses" value={data.kpis.revenue12m} trend={0} prefix="R$ " variant="dark" />
                            <KPI_Card label="LTV 12 Meses" value={data.kpis.ltv12m} trend={0} prefix="R$ " variant="dark" />
                            <KPI_Card label="ROI 12 Meses" value={data.kpis.roi12m} suffix="%" trend={0} isCurrency={false} variant="dark" />
                        </div>
                    </div>

                </div>

                {/* Funnel Section Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Funil de Vendas</h3>
                        <div className="min-h-[300px] flex items-center justify-center p-4">
                            <FunnelOverview data={funnelData} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-semibold text-white mb-4">Dados Mês Anterior</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm text-slate-400">Receita</span>
                                    <p className="text-xl font-bold text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.previous?.revenue || 0)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-400">Investimento</span>
                                    <p className="text-xl font-bold text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.previous?.investment || 0)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">Período: {data.previous?.range}</span>
                                    <div className="bg-slate-800 text-slate-500 font-bold p-2 text-center rounded mt-1">-</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
