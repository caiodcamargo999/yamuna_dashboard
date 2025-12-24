import { Header } from "@/components/layout/Header";
import { fetchFunnelData } from "@/app/funnel-actions";
import { MonthlyGoalEditor } from "@/components/funnel/MonthlyGoalEditor";
import { FunnelVisualization } from "@/components/funnel/FunnelVisualization";
import { MonthComparison } from "@/components/funnel/MonthComparison";
import { TopProducts } from "@/components/funnel/TopProducts";
import { ProjectionSection } from "@/components/funnel/ProjectionSection";
import { ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

// Force dynamic rendering to respect date filters
export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function FunnelPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    const data = await fetchFunnelData(startDate, endDate);

    // Check if we have GA4 data
    const hasGA4Data = data.selectedPeriod.sessions > 0;
    const hasTransactionData = data.selectedPeriod.transactions > 0;

    return (
        <>
            <Header title="Funil Loja Virtual" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {/* Data Status Alert - if no GA4 */}
                {!hasGA4Data && (
                    <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
                        <div>
                            <h4 className="text-amber-400 font-semibold mb-1">Dados do GA4 Indisponíveis</h4>
                            <p className="text-slate-300 text-sm">
                                O funil está mostrando estimativas baseadas em {data.selectedPeriod.transactions} transações.
                                Para dados completos, verifique a integração do Google Analytics 4.
                            </p>
                        </div>
                    </div>
                )}

                {/* Monthly Goal Editor */}
                <MonthlyGoalEditor
                    month={data.currentMonth.month}
                    year={data.currentMonth.year}
                    currentRevenueGoal={data.currentMonth.goal?.revenue_goal || 0}
                    currentTransactionsGoal={data.currentMonth.goal?.transactions_goal || 0}
                    currentAdBudgetGoal={data.currentMonth.goal?.ad_budget_goal || 0}
                />

                {/* Projection Section - Shows after user sets goals */}
                <ProjectionSection
                    currentMonthRevenue={data.currentMonth.revenue}
                    currentMonthTransactions={data.currentMonth.transactions}
                    currentMonthInvestment={data.currentMonth.investment}
                    revenueGoal={data.currentMonth.goal?.revenue_goal || 0}
                    transactionsGoal={data.currentMonth.goal?.transactions_goal || 0}
                    adBudgetGoal={data.currentMonth.goal?.ad_budget_goal || 0}
                    historicalConversionRate={data.historical.conversionRate}
                    historicalAvgTicket={data.historical.avgTicket}
                    historicalROAS={data.historical.roas}
                    daysElapsed={data.currentMonth.daysElapsed}
                    daysInMonth={data.currentMonth.daysInMonth}
                />

                {/* Funnel Visualization */}
                <FunnelVisualization
                    funnel={data.selectedPeriod}
                />

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <GlassCard className="flex flex-col justify-center gap-2">
                        <p className="text-slate-400 text-sm">Ticket Médio</p>
                        <p className="text-white text-2xl font-bold">
                            R$ {data.selectedPeriod.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {hasTransactionData && (
                            <p className="text-slate-500 text-xs">
                                {data.selectedPeriod.transactions} transações
                            </p>
                        )}
                    </GlassCard>

                    <GlassCard className="flex flex-col justify-center gap-2">
                        <p className="text-slate-400 text-sm">Sessões Totais</p>
                        <p className="text-white text-2xl font-bold">
                            {data.selectedPeriod.sessions.toLocaleString('pt-BR')}
                        </p>
                        {!hasGA4Data && (
                            <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> Estimativa
                            </p>
                        )}
                    </GlassCard>

                    <GlassCard className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-full">
                            <ShoppingCart className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Eventos Carrinho</p>
                            <p className="text-white text-2xl font-bold">
                                {data.selectedPeriod.addToCarts.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </GlassCard>

                    <GlassCard className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-full">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Taxa de Conversão</p>
                            <p className="text-white text-2xl font-bold">
                                {data.selectedPeriod.conversionRate.toFixed(2)}%
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Month Comparison */}
                <MonthComparison
                    currentMonth={data.currentMonth}
                    previousMonth={data.previousMonth}
                />

                {/* Top Products */}
                <TopProducts products={data.selectedPeriod.products} />

                {/* Debug Info - Only show in development */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs">
                        <summary className="text-slate-400 cursor-pointer font-mono mb-2">🐛 Debug Info</summary>
                        <pre className="text-slate-500 overflow-auto">
                            {JSON.stringify({
                                selectedPeriod: {
                                    sessions: data.selectedPeriod.sessions,
                                    transactions: data.selectedPeriod.transactions,
                                    revenue: data.selectedPeriod.revenue,
                                    addToCarts: data.selectedPeriod.addToCarts,
                                    checkouts: data.selectedPeriod.checkouts,
                                },
                                currentMonth: {
                                    revenue: data.currentMonth.revenue,
                                    transactions: data.currentMonth.transactions,
                                    investment: data.currentMonth.investment,
                                    goal: data.currentMonth.goal
                                },
                                hasGA4Data,
                                hasTransactionData
                            }, null, 2)}
                        </pre>
                    </details>
                )}
            </main>
        </>
    );
}
