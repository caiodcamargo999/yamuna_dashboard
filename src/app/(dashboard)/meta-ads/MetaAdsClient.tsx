"use client";

import { useState, useMemo } from "react";
import { CreativeModal } from "@/components/meta/CreativeModal";
import { Filter } from "lucide-react";

interface Creative {
    id: string;
    name: string;
    status: string;
    imageUrl: string;
    videoUrl?: string | null;
    videoId?: string | null;
    embedHtml?: string | null;
    creativeType: 'image' | 'video';
    campaignObjective: string;
    spend: number;
    clicks: number;
    ctr: number;
    cpc: number;
    roas: number;
    purchases: number;
    revenue: number;
    cpa: number;
    leads: number;
    cpl: number;
}

interface MetaAdsClientProps {
    creatives: Creative[];
    startDate: string;
    endDate: string;
}

export function MetaAdsClient({ creatives, startDate, endDate }: MetaAdsClientProps) {
    const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter states
    const [metricFilter, setMetricFilter] = useState<string>("all");
    const [objectiveFilter, setObjectiveFilter] = useState<string>("all");

    // Get unique objectives for filter dropdown
    const uniqueObjectives = useMemo(() => {
        const objectives = new Set(creatives.map(c => c.campaignObjective));
        return Array.from(objectives).sort();
    }, [creatives]);

    // Filter creatives based on selected filters
    const filteredCreatives = useMemo(() => {
        let filtered = [...creatives];

        // Filter by objective
        if (objectiveFilter !== "all") {
            filtered = filtered.filter(c => c.campaignObjective === objectiveFilter);
        }

        // Filter by metric (sort)
        if (metricFilter !== "all") {
            filtered.sort((a, b) => {
                switch (metricFilter) {
                    case "roas": return b.roas - a.roas;
                    case "cpa": return a.cpa - b.cpa; // Lower is better
                    case "ctr": return b.ctr - a.ctr;
                    case "spend": return b.spend - a.spend;
                    case "revenue": return b.revenue - a.revenue;
                    default: return 0;
                }
            });
        }

        return filtered;
    }, [creatives, metricFilter, objectiveFilter]);

    const handleThumbnailClick = (creative: Creative) => {
        setSelectedCreative(creative);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedCreative(null), 300);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {/* Filter / Header Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Top Criativos</h2>
                            <p className="text-xs text-slate-500">
                                {startDate === "30daysAgo" ? "Últimos 30 dias" :
                                    endDate === "today" && startDate !== "30daysAgo" ? `${startDate} até hoje` :
                                        `${startDate} até ${endDate}`}
                            </p>
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-slate-500" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Filtros:</span>
                            </div>

                            {/* Metric Filter */}
                            <select
                                value={metricFilter}
                                onChange={(e) => setMetricFilter(e.target.value)}
                                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Todas Métricas</option>
                                <option value="roas">Melhor ROAS</option>
                                <option value="cpa">Menor CPA</option>
                                <option value="ctr">Melhor CTR</option>
                                <option value="spend">Maior Gasto</option>
                                <option value="revenue">Maior Receita</option>
                            </select>

                            {/* Objective Filter */}
                            <select
                                value={objectiveFilter}
                                onChange={(e) => setObjectiveFilter(e.target.value)}
                                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Todos Objetivos</option>
                                {uniqueObjectives.map(obj => (
                                    <option key={obj} value={obj}>{obj}</option>
                                ))}
                            </select>

                            {/* Results Count */}
                            <span className="text-xs text-slate-500">
                                {filteredCreatives.length} anúncio{filteredCreatives.length !== 1 ? 's' : ''}
                            </span>
                        </div>
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
                            {filteredCreatives.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                                        Nenhum dado encontrado. Verifique se há anúncios ativos e se o Token é válido.
                                    </td>
                                </tr>
                            ) : (
                                filteredCreatives.map((ad: Creative, i: number) => (
                                    <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-2" title={ad.name}>
                                                {i + 1}. {ad.name}
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 inline-block">
                                                    {ad.status}
                                                </span>
                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 inline-block">
                                                    {ad.campaignObjective}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleThumbnailClick(ad)}
                                                className="w-16 h-16 relative inline-block rounded overflow-hidden bg-slate-200 dark:bg-slate-800 border dark:border-slate-700 hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer group"
                                            >
                                                {ad.imageUrl ? (
                                                    <>
                                                        <img
                                                            src={ad.imageUrl}
                                                            alt="Thumbnail"
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        {ad.creativeType === 'video' && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                                                                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                                                                    <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-slate-900 border-b-4 border-b-transparent ml-0.5"></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-[10px] text-slate-500">Sem Img</div>
                                                )}
                                            </button>
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

            {/* Creative Modal */}
            <CreativeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                creative={selectedCreative ? {
                    name: selectedCreative.name,
                    imageUrl: selectedCreative.imageUrl,
                    videoUrl: selectedCreative.videoUrl || undefined,
                    embedHtml: selectedCreative.embedHtml || undefined,
                    type: selectedCreative.creativeType
                } : null}
            />
        </>
    );
}
