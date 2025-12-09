import { Header } from "@/components/layout/Header";
import { fetchFunnelData } from "@/app/funnel-actions";
import { MonthlyGoalEditor } from "@/components/funnel/MonthlyGoalEditor";
import { FunnelVisualization } from "@/components/funnel/FunnelVisualization";
import { MonthComparison } from "@/components/funnel/MonthComparison";
import { TopProducts } from "@/components/funnel/TopProducts";
import { ShoppingCart, TrendingUp } from "lucide-react";

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function FunnelPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    const data = await fetchFunnelData(startDate, endDate);

    return (
        <>
            <Header title="Funil Loja Virtual" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {/* Monthly Goal Editor */}
                <MonthlyGoalEditor
                    month={data.currentMonth.month}
                    year={data.currentMonth.year}
                    currentRevenueGoal={data.currentMonth.goal?.revenue_goal || 0}
                    currentTransactionsGoal={data.currentMonth.goal?.transactions_goal || 0}
                />

                {/* Funnel Visualization */}
                <FunnelVisualization
                    funnel={data.selectedPeriod}
                />

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-2">Ticket Médio</p>
                        <p className="text-white text-2xl font-bold">
                            R$ {data.selectedPeriod.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-2">Sessões Totais</p>
                        <p className="text-white text-2xl font-bold">
                            {data.selectedPeriod.sessions.toLocaleString('pt-BR')}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                        <ShoppingCart className="text-indigo-400" size={32} />
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Eventos Carrinho</p>
                            <p className="text-white text-2xl font-bold">
                                {data.selectedPeriod.addToCarts.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                        <TrendingUp className="text-emerald-400" size={32} />
                        <div>
                            <p className="text-slate-400 text-sm mb-1">Sessões/Carrinhos</p>
                            <p className="text-white text-2xl font-bold">
                                {data.selectedPeriod.sessionsPerCart.toFixed(1)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Month Comparison */}
                <MonthComparison
                    currentMonth={data.currentMonth}
                    previousMonth={data.previousMonth}
                />

                {/* Top Products */}
                <TopProducts products={data.selectedPeriod.products} />
            </main>
        </>
    );
}
