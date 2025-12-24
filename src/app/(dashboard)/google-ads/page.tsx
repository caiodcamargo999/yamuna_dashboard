
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
            <main className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto relative">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Intro / Note */}
                <div className="bg-blue-950/20 border border-blue-500/10 rounded-xl p-4 flex items-center gap-4 relative z-10 backdrop-blur-md">
                    <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/10">
                        <Users className="text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-blue-200 text-sm">
                            Mostrando dados de tráfego <strong>Pago do Google</strong> capturados pelo Google Analytics 4.
                        </p>
                        <p className="text-blue-400/60 text-xs mt-0.5">
                            Métricas de custo (CPC, ROAS) requerem vínculo direto com o Google Ads e importação de custo no GA4.
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {/* Sessions */}
                    <div className="bg-[#0B0B1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-lg">
                        <div className="absolute -right-6 -top-6 bg-indigo-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sessões (Cliques)</p>
                                <MousePointer2 className="w-5 h-5 text-indigo-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                                {totals.sessions.toLocaleString('pt-BR')}
                            </h3>
                            <p className="text-xs text-indigo-300/60 font-mono mt-1">Visitantes via Google CPC</p>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-[#0B0B1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg">
                        <div className="absolute -right-6 -top-6 bg-emerald-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receita Gerada</p>
                                <DollarSign className="w-5 h-5 text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left shadow-emerald-500/20 drop-shadow-sm">
                                <span className="text-lg text-slate-500 font-normal mr-1">R$</span>
                                {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-emerald-400/60 font-mono mt-1">Faturamento atribuído</p>
                        </div>
                    </div>

                    {/* Purchases */}
                    <div className="bg-[#0B0B1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-lg">
                        <div className="absolute -right-6 -top-6 bg-amber-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Conversões</p>
                                <ShoppingBag className="w-5 h-5 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                                {totals.purchases}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-mono">
                                Taxa de Conv.: <span className="text-amber-400 font-bold">{conversionRate.toFixed(2)}%</span>
                            </p>
                        </div>
                    </div>

                    {/* Avg Ticket */}
                    <div className="bg-[#0B0B1E]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-violet-500/30 transition-all shadow-lg">
                        <div className="absolute -right-6 -top-6 bg-violet-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ticket Médio Ads</p>
                                <DollarSign className="w-5 h-5 text-violet-400 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                                <span className="text-lg text-slate-500 font-normal mr-1">R$</span>
                                {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-violet-400/60 font-mono mt-1">Por conversão</p>
                        </div>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0B0B1E]/60 backdrop-blur-md shadow-2xl z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

                    <div className="p-6 border-b border-white/5 bg-slate-900/20 relative z-10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Performance por Campanha
                        </h3>
                        <span className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded font-mono">Top Campanhas via GA4</span>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-[#050510]/80 text-slate-400 text-xs uppercase font-semibold backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4">Campanha</th>
                                    <th className="px-6 py-4 text-right">Sessões</th>
                                    <th className="px-6 py-4 text-right">Conversões</th>
                                    <th className="px-6 py-4 text-right">Taxa Conv.</th>
                                    <th className="px-6 py-4 text-right">Receita</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <MousePointer2 className="w-8 h-8 text-slate-600 mb-2" />
                                                Nenhum tráfego do Google Ads (medium=cpc) encontrado neste período.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((camp, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-white group-hover:text-indigo-400 transition-colors max-w-[300px] truncate" title={camp.name}>
                                                {camp.name}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-400">
                                                {camp.sessions.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-white">
                                                {camp.purchases}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                                                    {camp.conversionRate.toFixed(2)}%
                                                </span>
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
