import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { ShoppingCart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchProductsData } from "@/app/products-actions";
import { Suspense } from "react";


export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
    searchParams: Promise<{
        start?: string;
        end?: string;
    }>;
}

export default async function ProductsPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    // Fetch real products from Tiny orders
    const products = await fetchProductsData(startDate, endDate);

    return (
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
            <div className="flex items-center justify-between py-6">
                <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
                    Curva ABC (Tiny)
                </h2>
                <div className="flex items-center space-x-2">
                    <DateRangeFilter />
                </div>
            </div>

            <main className="space-y-6 overflow-y-auto w-full">
                <Card className="overflow-hidden">

                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="text-primary" size={24} />
                            Curva ABC - Primeiros Pedidos
                        </CardTitle>
                        <span className="text-xs bg-muted py-1 px-3 rounded-full border">Fonte: Tiny ERP (Live)</span>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-[#050510]/80 text-slate-400 font-semibold text-xs uppercase tracking-wider backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Nome do Produto</th>
                                        <th className="px-6 py-4 text-right">Qtd Vendida</th>
                                        <th className="px-6 py-4 text-right">Receita Total</th>
                                        <th className="px-6 py-4 text-right">% Receita</th>
                                        <th className="px-6 py-4 text-right">% Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-3 rounded-full bg-slate-800/50">
                                                        <ShoppingCart className="text-slate-600" size={24} />
                                                    </div>
                                                    <p>Nenhum produto vendido no período selecionado</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product: any, i: number) => {
                                            // Determine ABC classification color (Glow effects)
                                            const isClassA = product.percentage <= 80;
                                            const isClassB = product.percentage > 80 && product.percentage <= 95;

                                            // Row style based on class
                                            const rowClass = isClassA
                                                ? 'hover:bg-emerald-500/5 hover:shadow-[inset_2px_0_0_0_rgba(16,185,129,0.5)]'
                                                : isClassB
                                                    ? 'hover:bg-amber-500/5 hover:shadow-[inset_2px_0_0_0_rgba(245,158,11,0.5)]'
                                                    : 'hover:bg-white/5';

                                            return (
                                                <tr key={i} className={`transition-all duration-200 ${rowClass}`}>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.code}</td>
                                                    <td className="px-6 py-4 font-medium text-white max-w-[300px] truncate" title={product.name}>
                                                        {product.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                                        {product.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-white font-bold">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono">
                                                        <div className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/5 text-xs">
                                                            {product.revenuePercentage.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold flex justify-end items-center gap-2">
                                                        {/* Trend Indicator */}
                                                        {product.trend && (
                                                            <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${product.trend.direction === 'up'
                                                                ? 'text-emerald-400 bg-emerald-500/10'
                                                                : product.trend.direction === 'down'
                                                                    ? 'text-rose-400 bg-rose-500/10'
                                                                    : 'text-slate-500 bg-slate-500/10'
                                                                }`}>
                                                                {product.trend.direction === 'up' && <TrendingUp size={12} />}
                                                                {product.trend.direction === 'down' && <TrendingDown size={12} />}
                                                                {product.trend.direction === 'neutral' && <Minus size={12} />}
                                                                <span>{product.trend.value > 0 ? `${product.trend.value.toFixed(0)}%` : '-'}</span>
                                                            </div>
                                                        )}

                                                        <span className={`${isClassA ? 'text-emerald-400' : isClassB ? 'text-amber-400' : 'text-slate-500'}`}>
                                                            {product.percentage.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {products.length > 0 && (
                    <div className="p-4 bg-[#050510]/50 border-t border-white/5 text-xs text-slate-400 flex flex-wrap gap-4">
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span> <strong>Classe A:</strong> Até 80% da receita</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span> <strong>Classe B:</strong> 80% a 95% da receita</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-600"></span> <strong>Classe C:</strong> Acima de 95%</p>
                    </div>
                )}
            </main>
        </div>
    );
}
