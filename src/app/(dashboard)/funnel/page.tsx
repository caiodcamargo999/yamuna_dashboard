import { Header } from "@/components/layout/Header";
import { FunnelOverview } from "@/components/charts/FunnelOverview";
import { fetchDashboardData } from "@/app/actions";

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function FunnelPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    const data = await fetchDashboardData(startDate, endDate);

    const funnelData = [
        { stage: "Sessões", users: data.sessions, value: data.sessions.toLocaleString('pt-BR'), subLabel: "Sessões" },
        { stage: "Transações", users: data.transactions, value: data.transactions.toLocaleString('pt-BR'), subLabel: "Transações" },
        // Filler for other stages not yet tracked
        { stage: "Produtos", users: 0, value: "-", subLabel: "Produtos Visualizados" },
        { stage: "Carrinho", users: 0, value: "-", subLabel: "Add ao Carrinho" },
        { stage: "Checkout", users: 0, value: "-", subLabel: "Checkout Iniciado" },
    ];

    return (
        <>
            <Header title="Funil Loja Virtual" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-xl font-bold text-white mb-6 text-center">Visualização do Funil</h3>
                        <div className="min-h-[400px] flex items-center justify-center">
                            <FunnelOverview data={funnelData} />
                        </div>
                    </div>

                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h3 className="text-xl font-bold text-white mb-6">Detalhamento</h3>
                        <div className="space-y-4">
                            {funnelData.map((stage) => (
                                <div key={stage.stage} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                                    <span className="text-slate-300 font-medium">{stage.subLabel}</span>
                                    <div className="text-right">
                                        <span className="block text-white font-bold text-lg">{stage.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
