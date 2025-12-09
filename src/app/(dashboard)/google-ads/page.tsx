import { Header } from "@/components/layout/Header";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Props {
    searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function GoogleAdsPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    // Real data - will be populated when Google Ads API is connected
    const metrics = {
        impressions: 0,
        clicks: 0,
        cpcAvg: 0,
        ctr: 0,
        cost: 0,
        revenue: 0,
        roas: 0,
        avgTicket: 0,
        costPerPurchase: 0
    };

    const campaigns: any[] = [];

    return (
        <>
            <Header title="Google Ads" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-orange-600 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Impressões</p>
                        <p className="text-white text-2xl font-bold">
                            {(metrics.impressions / 1000).toFixed(2)}k
                        </p>
                        <p className="text-xs text-green-400 mt-1">↑ 18,3%</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Cliques</p>
                        <p className="text-white text-2xl font-bold">
                            {(metrics.clicks / 1000).toFixed(1)} mil
                        </p>
                        <p className="text-xs text-green-400 mt-1">↑ 9,5%</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">CPC médio</p>
                        <p className="text-white text-2xl font-bold">
                            R$ {metrics.cpcAvg.toFixed(2)}
                        </p>
                        <p className="text-xs text-green-400 mt-1">↑ 13,0%</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">CTR</p>
                        <p className="text-white text-2xl font-bold">
                            {metrics.ctr}%
                        </p>
                        <p className="text-xs text-green-400 mt-1">↑ 10,3%</p>
                    </div>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-orange-600 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="text-white" size={16} />
                            <p className="text-white text-xs">Custo</p>
                        </div>
                        <p className="text-white text-2xl font-bold">
                            R$ {metrics.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-orange-600 rounded-xl p-4">
                        <p className="text-white text-xs mb-1">Receita</p>
                        <p className="text-white text-2xl font-bold">
                            R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div className="bg-orange-600 rounded-xl p-4">
                        <p className="text-white text-xs mb-1">ROAS</p>
                        <p className="text-white text-2xl font-bold">
                            {metrics.roas.toFixed(1)}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Ticket Médio</p>
                        <p className="text-white text-2xl font-bold">
                            R$ {metrics.avgTicket.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Custo por Compra</p>
                        <p className="text-white text-2xl font-bold">
                            {metrics.costPerPurchase.toFixed(1)}
                        </p>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">Campanhas</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Campanha</th>
                                    <th className="px-4 py-3 text-right">Custo</th>
                                    <th className="px-4 py-3 text-right">% Δ</th>
                                    <th className="px-4 py-3 text-right">Cliques</th>
                                    <th className="px-4 py-3 text-right">CPC médio</th>
                                    <th className="px-4 py-3 text-right">CTR</th>
                                    <th className="px-4 py-3 text-right">Compras</th>
                                    <th className="px-4 py-3 text-right">% Δ</th>
                                    <th className="px-4 py-3 text-right">Custo/conv.</th>
                                    <th className="px-4 py-3 text-right">% Δ</th>
                                    <th className="px-4 py-3 text-right">Receita</th>
                                    <th className="px-4 py-3 text-right">% Δ</th>
                                    <th className="px-4 py-3 text-right">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="px-4 py-12 text-center">
                                            <p className="text-slate-400 mb-2">Nenhuma campanha do Google Ads encontrada</p>
                                            <p className="text-slate-500 text-xs">Configure a API do Google Ads para ver os dados aqui</p>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((campaign, i) => (
                                        <tr key={i} className="hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-white font-medium">{campaign.name}</td>
                                            <td className="px-4 py-3 text-right font-mono">R$ {campaign.cost}</td>
                                            <td className={`px-4 py-3 text-right text-xs ${campaign.deltaPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {campaign.deltaPercent >= 0 ? '↑' : '↓'} {Math.abs(campaign.deltaPercent)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{campaign.clicks}</td>
                                            <td className="px-4 py-3 text-right font-mono">R$ {campaign.cpc.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{campaign.ctr}%</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">{campaign.purchases}</td>
                                            <td className={`px-4 py-3 text-right text-xs ${campaign.purchaseDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {campaign.purchaseDelta >= 0 ? '↑' : '↓'} {Math.abs(campaign.purchaseDelta)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">R$ {campaign.costPerConv}</td>
                                            <td className={`px-4 py-3 text-right text-xs ${campaign.convDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {campaign.convDelta >= 0 ? '↑' : '↓'} {Math.abs(campaign.convDelta)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400">R$ {campaign.revenue.toLocaleString('pt-BR')}</td>
                                            <td className={`px-4 py-3 text-right text-xs ${campaign.revenueDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {campaign.revenueDelta >= 0 ? '↑' : '↓'} {Math.abs(campaign.revenueDelta)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">{campaign.roas.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">
                        <strong>Nota:</strong> Configure a API do Google Ads para ver dados detalhados de campanhas, palavras-chave e anúncios.
                        Consulte o arquivo <code>GOOGLE_ADS_SETUP.md</code> para instruções.
                    </p>
                </div>
            </main>
        </>
    );
}
