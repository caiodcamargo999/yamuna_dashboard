
import { Header } from "@/components/layout/Header";
import { DollarSign, MousePointer2, ShoppingBag, Users } from "lucide-react";
import { getGA4GoogleAdsCampaigns } from "@/lib/services/ga4-reports";
import { format, subDays, parseISO } from "date-fns";

// Enable dynamic rendering
export const dynamic = 'force-dynamic';

interface Props {
    searchParams: { start?: string; end?: string };
}

export default async function GoogleAdsPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    // Date parsing logic (same as main dashboard)
    let startIso = startDate;
    let endIso = endDate;

    if (startDate === "30daysAgo") {
        startIso = format(subDays(new Date(), 30), "yyyy-MM-dd");
    }
    if (endDate === "today") {
        endIso = format(new Date(), "yyyy-MM-dd");
    }

    // Fetch data
    const data = await getGA4GoogleAdsCampaigns(startIso, endIso);

    const totals = data?.totals || { sessions: 0, purchases: 0, revenue: 0 };
    const campaigns = data?.campaigns || [];

    // Calculate derived metrics
    const conversionRate = totals.sessions > 0 ? (totals.purchases / totals.sessions) * 100 : 0;
    const avgTicket = totals.purchases > 0 ? totals.revenue / totals.purchases : 0;

    return (
        <>
            <Header title="Google Ads (via GA4)" />
            <main className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-fade-in">

                {/* Intro / Note */}
                <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-3 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <Users className="text-blue-400 w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-blue-200 text-sm">
                            Mostrando dados de tráfego <strong>Pago do Google</strong> capturados pelo Google Analytics 4.
                        </p>
                        <p className="text-blue-400/60 text-xs">
                            Métricas de custo (CPC, ROAS) requerem vínculo direto com o Google Ads e importação de custo no GA4.
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sessions */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MousePointer2 className="w-16 h-16 text-indigo-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Sessões (Cliques)</p>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            {totals.sessions.toLocaleString('pt-BR')}
                        </h3>
                        <p className="text-xs text-slate-500">Visitantes via Google CPC</p>
                    </div>

                    {/* Revenue */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-16 h-16 text-emerald-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Receita Gerada</p>
                        <h3 className="text-3xl font-bold text-emerald-400 mb-1">
                            R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-emerald-500/60">Faturamento atribuído</p>
                    </div>

                    {/* Purchases */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag className="w-16 h-16 text-amber-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Conversões</p>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            {totals.purchases}
                        </h3>
                        <p className="text-xs text-slate-500">
                            Taxa de Conv.: <span className="text-amber-400">{conversionRate.toFixed(2)}%</span>
                        </p>
                    </div>

                    {/* Avg Ticket */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-16 h-16 text-violet-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-2">Ticket Médio Ads</p>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Performance por Campanha</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Top Campanhas via GA4</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Campanha</th>
                                    <th className="px-6 py-4 text-right">Sessões</th>
                                    <th className="px-6 py-4 text-right">Conversões</th>
                                    <th className="px-6 py-4 text-right">Taxa Conv.</th>
                                    <th className="px-6 py-4 text-right">Receita</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Nenhum tráfego do Google Ads (medium=cpc) encontrado neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((camp, i) => (
                                        <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-white group-hover:text-indigo-400 transition-colors">
                                                {camp.name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-400">
                                                {camp.sessions.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-white">
                                                {camp.purchases}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-amber-400/90">
                                                {camp.conversionRate.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                                R$ {camp.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
