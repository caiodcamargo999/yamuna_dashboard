"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, TrendingUp, Package, AlertTriangle, CalendarClock } from "lucide-react";
import { fetchProductAnalysis } from "@/app/products-actions";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";

interface ProductAnalysisSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: {
        code: string;
        name: string;
    } | null;
}

export function ProductAnalysisSheet({ open, onOpenChange, product }: ProductAnalysisSheetProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && product) {
            setLoading(true);
            fetchProductAnalysis(product.code, product.name)
                .then(setData)
                .catch(err => console.error("Failed to load analysis", err))
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [open, product]);

    if (!product) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl overflow-y-auto bg-[#050510] border-l-white/10 text-slate-200">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold text-white flex gap-2 items-center">
                        {product.name}
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Código: <span className="font-mono text-xs bg-slate-800 px-1 py-0.5 rounded">{product.code}</span>
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex h-[400px] items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : data ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* 1. CHART SECTION */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-400" />
                                    Sazonalidade e Previsão (12 Meses)
                                </h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500/50 border border-blue-500"></div> Realizado</div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500 border-dashed"></div> Previsão</div>
                                </div>
                            </div>

                            <div className="h-[300px] w-full bg-slate-900/30 rounded-xl p-4 border border-white/5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            formatter={(value: any, name: any, props: any) => {
                                                const isForecast = props.payload.isForecast;
                                                return [value, isForecast ? "Previsão (un)" : "Vendas (un)"];
                                            }}
                                        />

                                        {/* Reference line separating history from forecast */}
                                        {/* We can do this by splitting lines or just rendering simple logic */}

                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                            connectNulls={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. STOCK FORECAST SECTION */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-2">
                                <div className="text-slate-400 text-sm flex items-center gap-2">
                                    <Package size={16} /> Estoque Atual
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {data.stockStatus === 'unknown' ? '?' : data.stock} <span className="text-sm font-normal text-slate-500">unidades</span>
                                </div>
                                {data.stockStatus === 'unknown' && (
                                    <p className="text-xs text-amber-500">Não foi possível sincronizar com Tiny</p>
                                )}
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-2">
                                <div className="text-slate-400 text-sm flex items-center gap-2">
                                    <CalendarClock size={16} /> Cobertura
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {data.stockCoverageDays} <span className="text-sm font-normal text-slate-500">dias</span>
                                </div>
                                <p className="text-xs text-slate-500">Baseado na média mensal de {data.avgMonthlySales} un.</p>
                            </div>
                        </div>

                        {/* 3. SUGGESTION ALERT */}
                        {(data.stockCoverageDays < 30) ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-amber-400 mb-1">Atenção: Estoque Baixo</h4>
                                    <p className="text-sm text-amber-200/80">
                                        Seu estoque atual cobre apenas {data.stockCoverageDays} dias de vendas.
                                        Considerando o lead time aproximado, sugerimos realizar um novo pedido de compra para evitar ruptura.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500 shrink-0">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-emerald-400 mb-1">Estoque Saudável</h4>
                                    <p className="text-sm text-emerald-200/80">
                                        Você tem estoque garantido para {data.stockCoverageDays} dias. Nenhuma ação necessária por enquanto.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        Erro ao carregar dados. Tente novamente mais tarde.
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
