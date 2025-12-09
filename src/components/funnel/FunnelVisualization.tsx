"use client";

import { ArrowDown } from "lucide-react";

interface FunnelVisualizationProps {
    funnel: {
        sessions: number;
        addToCarts: number;
        checkouts: number;
        transactions: number;
        cartRate: number;
        checkoutRate: number;
        transactionRate: number;
    };
}

export function FunnelVisualization({ funnel }: FunnelVisualizationProps) {
    const stages = [
        {
            label: "Sessões",
            value: funnel.sessions,
            rate: null,
            color: "from-orange-600 to-orange-700"
        },
        {
            label: "Add ao Carrinho",
            value: funnel.addToCarts,
            rate: funnel.cartRate,
            color: "from-orange-600 to-orange-700"
        },
        {
            label: "Checkout Iniciado",
            value: funnel.checkouts,
            rate: funnel.checkoutRate,
            color: "from-orange-600 to-orange-700"
        },
        {
            label: "Transações",
            value: funnel.transactions,
            rate: funnel.transactionRate,
            color: "from-orange-600 to-orange-700"
        }
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-8 text-center">Visualização do Funil</h3>

            <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
                {stages.map((stage, index) => {
                    const previousStage = index > 0 ? stages[index - 1] : null;
                    const widthPercent = previousStage
                        ? Math.max((stage.value / previousStage.value) * 100, 30)
                        : 100;

                    return (
                        <div key={stage.label} className="w-full">
                            {/* Funnel Stage Box */}
                            <div
                                className={`relative bg-gradient-to-r ${stage.color} rounded-lg p-4 shadow-lg transition-all duration-300 hover:scale-105`}
                                style={{
                                    width: `${widthPercent}%`,
                                    marginLeft: 'auto',
                                    marginRight: 'auto'
                                }}
                            >
                                <div className="text-center">
                                    <p className="text-white/90 font-medium text-sm mb-1">{stage.label}</p>
                                    <p className="text-white font-bold text-2xl">
                                        {stage.value.toLocaleString('pt-BR')}
                                    </p>
                                </div>

                                {/* Conversion Rate Badge */}
                                {stage.rate !== null && (
                                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-slate-900 border-2 border-orange-600 rounded-lg px-3 py-1.5 shadow-lg">
                                        <p className="text-xs text-slate-400 mb-0.5">Taxa</p>
                                        <p className="text-orange-400 font-bold text-sm whitespace-nowrap">
                                            {stage.rate.toFixed(2)}%
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Arrow Down */}
                            {index < stages.length - 1 && (
                                <div className="flex justify-center my-2">
                                    <ArrowDown className="text-orange-600" size={28} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sessões → Carrinho</p>
                    <p className="text-white font-bold text-lg">{funnel.cartRate.toFixed(2)}%</p>
                </div>
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Carrinho → Checkout</p>
                    <p className="text-white font-bold text-lg">{funnel.checkoutRate.toFixed(2)}%</p>
                </div>
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Checkout → Transação</p>
                    <p className="text-white font-bold text-lg">{funnel.transactionRate.toFixed(2)}%</p>
                </div>
                <div className="text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Taxa Global</p>
                    <p className="text-emerald-400 font-bold text-lg">
                        {funnel.sessions > 0 ? ((funnel.transactions / funnel.sessions) * 100).toFixed(2) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
}
