// Server Component

import { Header } from "@/components/layout/Header";
import { Suspense } from "react";
import { getMetaTopCreatives } from "@/lib/services/meta";

export default async function MetaAdsPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
    const params = await searchParams;
    const startDate = params.start || "30daysAgo";
    const endDate = params.end || "today";

    const formatMetaDate = (str: string) => {
        const d = new Date();
        if (str === "today") return d.toISOString().split('T')[0];
        if (str === "30daysAgo") {
            d.setDate(d.getDate() - 30);
            return d.toISOString().split('T')[0];
        }
        return str;
    };

    const s = formatMetaDate(startDate);
    const e = formatMetaDate(endDate);

    const creativesResult: any = await getMetaTopCreatives(s, e);

    // Check if result is an error object
    const error = !Array.isArray(creativesResult) ? creativesResult.error : null;
    const creatives = Array.isArray(creativesResult) ? creativesResult : [];

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Meta Ads - Criativos" />
            </Suspense>
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-500 font-bold mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Erro na Conexão com Meta Ads
                        </div>
                        <p className="text-red-400 text-sm font-mono">{error}</p>
                        <p className="text-red-400/70 text-xs mt-2">Verifique seu Token de Acesso em .env.local</p>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    {/* Filter / Header Bar */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Top Criativos</h2>
                            <p className="text-xs text-slate-500">{startDate} até {endDate}</p>
                        </div>
                        <div className="flex gap-2">
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Campanha / Anúncio</th>
                                    <th className="px-4 py-3 text-center">Thumbnail</th>
                                    <th className="px-4 py-3 text-right">Custo</th>
                                    <th className="px-4 py-3 text-right">CPC</th>
                                    <th className="px-4 py-3 text-right">CTR</th>
                                    <th className="px-4 py-3 text-right">Leads</th>
                                    <th className="px-4 py-3 text-right">CPL</th>
                                    <th className="px-4 py-3 text-right">Compras</th>
                                    <th className="px-4 py-3 text-right">CPA (Custo/Compra)</th>
                                    <th className="px-4 py-3 text-right">Receita</th>
                                    <th className="px-4 py-3 text-right">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {creatives.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                                            Nenhum dado encontrado. Verifique se há anúncios ativos e se o Token é válido.
                                        </td>
                                    </tr>
                                ) : (
                                    creatives.map((ad: any, i: number) => (
                                        <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <div className="font-medium text-slate-900 dark:text-white line-clamp-2" title={ad.name}>
                                                    {i + 1}. {ad.name}
                                                </div>
                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-1 inline-block">
                                                    {ad.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="w-16 h-16 relative inline-block rounded overflow-hidden bg-slate-200 dark:bg-slate-800 border dark:border-slate-700">
                                                    {ad.imageUrl ? (
                                                        <img
                                                            src={ad.imageUrl}
                                                            alt="Thumbnail"
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-[10px] text-slate-500">Sem Img</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.spend)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.cpc)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                                                {ad.ctr.toFixed(2)}%
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-400">
                                                {ad.leads}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {ad.leads > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.cpl) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                {ad.purchases}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.cpa)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.revenue)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                <div className={`font-bold ${ad.roas >= 10 ? 'text-emerald-500' : ad.roas >= 4 ? 'text-emerald-400' : ad.roas >= 1 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                    {ad.roas.toFixed(2)}
                                                </div>
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
