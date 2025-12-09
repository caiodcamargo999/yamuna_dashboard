"use client";

import { Package } from "lucide-react";
import type { ProductSales } from "@/lib/services/tiny-products";

interface TopProductsProps {
    products: ProductSales[];
}

export function TopProducts({ products }: TopProductsProps) {
    if (!products || products.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Top 10 Produtos Vendidos</h3>
                <p className="text-slate-400 text-center py-8">Nenhum dado de produto disponível</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Package className="text-indigo-400" size={24} />
                Top 10 Produtos Vendidos
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left text-slate-400 font-medium text-sm py-3 px-3">#</th>
                            <th className="text-left text-slate-400 font-medium text-sm py-3 px-3">Produto</th>
                            <th className="text-right text-slate-400 font-medium text-sm py-3 px-3">Qtd</th>
                            <th className="text-right text-slate-400 font-medium text-sm py-3 px-3">Receita</th>
                            <th className="text-right text-slate-400 font-medium text-sm py-3 px-3">% Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr
                                key={product.productId}
                                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                            >
                                <td className="py-3 px-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-600 text-white' :
                                            index === 1 ? 'bg-gray-400 text-white' :
                                                index === 2 ? 'bg-orange-600 text-white' :
                                                    'bg-slate-700 text-slate-300'
                                        }`}>
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="py-3 px-3">
                                    <p className="text-white font-medium">{product.productName}</p>
                                    <p className="text-xs text-slate-500">ID: {product.productId}</p>
                                </td>
                                <td className="text-right py-3 px-3">
                                    <span className="text-white font-medium">
                                        {product.quantity.toLocaleString('pt-BR')}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-3">
                                    <span className="text-emerald-400 font-bold">
                                        R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="text-right py-3 px-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full"
                                                style={{ width: `${Math.min(product.percentage, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-300 text-sm font-medium w-12">
                                            {product.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
