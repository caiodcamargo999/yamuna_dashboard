import { Header } from "@/components/layout/Header";
import { fetchProductsData } from "@/app/actions";



import { Suspense } from "react";

export default async function ProductsPage() {
    // Fetch real products from Tiny
    const realProducts = await fetchProductsData();

    // If we have real content use it, else empty
    const products = realProducts;

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Curva ABC (Tiny)" />
            </Suspense>
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="tex-lg font-semibold text-white">Top Produtos (Receita)</h3>
                        <span className="text-xs text-slate-500">
                            {realProducts.length > 0 ? 'Fonte: Tiny ERP (Live)' : 'Fonte: Dados Simulados'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3 text-right">Estoque</th>
                                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                                    <th className="px-4 py-3 text-right">% Repr.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {products.map((product: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-800/50 transition-colors text-slate-300">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.code}</td>
                                        <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                                        <td className="px-4 py-3 text-right">{product.quantity}</td>
                                        <td className="px-4 py-3 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.revenue)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {product.percentage > 0 ? `${product.percentage}%` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
