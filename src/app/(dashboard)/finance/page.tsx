import { Header } from "@/components/layout/Header";
import { ArrowUp, ArrowDown, DollarSign, Users, RefreshCw, ShoppingCart } from "lucide-react";
import { fetchDashboardData } from "@/app/actions";
import { Suspense } from "react";

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function FinancePage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    const data = await fetchDashboardData(startDate, endDate);

    // Calculated KPIs
    const ticketMedio = data.transactions > 0 ? data.revenue / data.transactions : 0;

    // Estimate CAC (Investimento / Transações) - Crude approximation
    const cac = data.transactions > 0 ? data.investment / data.transactions : 0;

    // ROI = (Receita - Investimento) / Investimento
    const roi = data.investment > 0 ? (data.revenue - data.investment) / data.investment : 0;

    // Tiny vs GA4 discrepancy check
    const revenueDiscrepancy = data.tinyTotalRevenue - data.revenue;

    const kpiData = [
        { label: "Receita Faturada", value: data.revenue, trend: 0, icon: DollarSign, format: 'currency' },
        { label: "Investimento Ads", value: data.investment, trend: 0, icon: DollarSign, format: 'currency' },
        { label: "Ticket Médio", value: ticketMedio, trend: 0, icon: ShoppingCart, format: 'currency' },
        { label: "ROI (ROAS Geral)", value: roi, trend: 0, icon: RefreshCw, format: 'decimal' },
        { label: "Transações", value: data.transactions, trend: 0, icon: Users, format: 'number' },
        // { label: "Discrepância Tiny", value: revenueDiscrepancy, trend: 0, icon: ShoppingCart, format: 'currency' },
    ];

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Indicadores Financeiros (Real Time)" />
            </Suspense>
            <main className="p-6 space-y-8 overflow-y-auto w-full">

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {kpiData.map((kpi, idx) => (
                        <KpiCard key={idx} {...kpi} />
                    ))}
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-white font-bold mb-4">Eficiência de Pagamentos</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-400">Checkout Iniciado</span>
                                <span className="text-white font-mono">{data.checkouts}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-400">Transações Concluídas</span>
                                <span className="text-white font-mono">{data.transactions}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-slate-400">Taxa de Conversão do Checkout</span>
                                <span className="text-emerald-400 font-mono font-bold">
                                    {data.checkouts > 0 ? ((data.transactions / data.checkouts) * 100).toFixed(2) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-white font-bold mb-4">Custo por Aquisição (Estimado)</h3>
                        <div className="flex items-center justify-center h-full flex-col">
                            <span className="text-3xl font-bold text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cac)}
                            </span>
                            <span className="text-slate-500 text-sm mt-2">Investimento Total / Transações</span>
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}

function KpiCard({ label, value, trend, icon: Icon, format }: any) {
    let displayValue = value;
    if (format === 'currency') {
        displayValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    } else if (format === 'decimal') {
        displayValue = value.toFixed(2) + 'x';
    } else if (format === 'percent') {
        displayValue = value.toFixed(2) + '%';
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-center mb-2">
                {Icon && <Icon className="w-4 h-4 text-slate-500 mr-2" />}
                <span className="text-xs text-slate-500 text-center uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-center">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{displayValue}</p>
            </div>
        </div>
    )
}
