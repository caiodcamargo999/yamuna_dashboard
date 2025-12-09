import { Header } from "@/components/layout/Header";
import { FunnelOverview } from "@/components/charts/FunnelOverview";
import { fetchDashboardData } from "@/app/actions";


interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function OverviewPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    // Fetch real data on server side
    const data = await fetchDashboardData(startDate, endDate);

    // Hardcoded goals/projections since we don't have a backend DB for user settings yet
    const goal = 0;
    const projected = 0;
    // investment comes from GA4 now (advertiserAdCost)

    // Funnel data 
    const funnelData = [
        { stage: "Sessões", users: data.sessions, value: data.sessions.toLocaleString('pt-BR'), subLabel: "Sessões" },
        { stage: "Transações", users: data.transactions, value: data.transactions.toLocaleString('pt-BR'), subLabel: "Transações" },
        // Filler 0 for stages we don't track yet
        { stage: "Visualizações", users: 0, value: "-", subLabel: "Produtos" },
        { stage: "Carrinho", users: 0, value: "-", subLabel: "Add ao Carrinho" },
        { stage: "Checkout", users: 0, value: "-", subLabel: "Iniciado" },
    ];

    return (
        <>
            <Header title="Check-in Loja Virtual" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {/* Debug Info */}
                <div className="text-xs text-slate-500 flex flex-col gap-1">
                    <div className="flex gap-2">
                        <span>GA4: {data.source}</span>
                        <span>| Tiny: {data.tinySource}</span>
                    </div>
                    <div>
                        Filtro Ativo: {data.dateRange?.start} até {data.dateRange?.end}
                    </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-sm font-medium text-slate-400">Receita Faturada (GA4)</h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.revenue)}
                        </p>
                    </div>

                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-sm font-medium text-slate-400">Receita (Tiny)</h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.tinyTotalRevenue)}
                        </p>
                    </div>

                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-sm font-medium text-slate-400">Investimento</h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.investment)}
                        </p>
                        <span className="text-xs text-emerald-400 mt-1 block">⬆ 1.0%</span>
                    </div>

                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-sm font-medium text-slate-400">Projeção R$</h3>
                        <p className="text-2xl font-bold text-white mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projected)}
                        </p>
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
            </main>
        </>
    );
}
