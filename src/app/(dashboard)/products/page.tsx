import { Header } from "@/components/layout/Header";
import { fetchProductsData } from "@/app/products-actions";
import { Suspense } from "react";


export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
    searchParams: {
        start?: string;
        end?: string;
    };
}

export default async function ProductsPage(props: Props) {
    const searchParams = await props.searchParams;
    const startDate = searchParams.start || "30daysAgo";
    const endDate = searchParams.end || "today";

    // Fetch real products from Tiny orders
    const products = await fetchProductsData(startDate, endDate);

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Curva ABC (Tiny)" />
            </Suspense>
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Curva ABC - Primeiros Pedidos</h3>
                        <span className="text-xs text-slate-500">
                            Fonte: Tiny ERP (Live)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950 text-slate-400 font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Nome do Produto</th>
                                    <th className="px-4 py-3 text-right">Qtd Vendida</th>
                                    <th className="px-4 py-3 text-right">Receita Total</th>
                                    <th className="px-4 py-3 text-right">% Receita</th>
                                    <th className="px-4 py-3 text-right">% Acumulado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            Nenhum produto vendido no período selecionado
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product: any, i: number) => {
                                        // Determine ABC classification color
                                        const isClassA = product.percentage <= 80;
                                        const isClassB = product.percentage > 80 && product.percentage <= 95;
                                        const bgColor = isClassA ? 'bg-green-900/20' : isClassB ? 'bg-yellow-900/20' : 'bg-slate-800/20';

                                        return (
                                            <tr key={i} className={`hover:bg-slate-800/50 transition-colors text-slate-300 ${bgColor}`}>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.code}</td>
                                                <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {product.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.revenue)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {product.revenuePercentage.toFixed(2)}%
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold">
                                                    {product.percentage.toFixed(2)}%
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {products.length > 0 && (
                        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
                            <p><strong className="text-green-400">Classe A:</strong> Produtos que representam até 80% da receita (verde)</p>
                            <p><strong className="text-yellow-400">Classe B:</strong> Produtos entre 80% e 95% da receita (amarelo)</p>
                            <p><strong className="text-slate-400">Classe C:</strong> Produtos acima de 95% da receita (cinza)</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
