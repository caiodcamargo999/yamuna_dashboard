"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthComparisonProps {
    currentMonth: {
        month: number;
        year: number;
        revenue: number;
        transactions: number;
        investment: number;
        projectedRevenue: number;
        goal: any;
        revenueGoalPercent: number;
    };
    previousMonth: {
        month: number;
        year: number;
        revenue: number;
        transactions: number;
        investment: number;
        goal: any;
        revenueGoalPercent: number;
    };
}

export function MonthComparison({ currentMonth, previousMonth }: MonthComparisonProps) {
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const revenueChange = previousMonth.revenue > 0
        ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
        : 0;

    const investmentChange = previousMonth.investment > 0
        ? ((currentMonth.investment - previousMonth.investment) / previousMonth.investment) * 100
        : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Month */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                    {monthNames[currentMonth.month - 1]} {currentMonth.year} (Atual)
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Receita Faturada</span>
                        <span className="text-white text-xl font-bold">
                            R$ {currentMonth.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Meta Mensal</span>
                        <span className="text-white text-xl font-bold">
                            {currentMonth.goal?.revenue_goal
                                ? `R$ ${currentMonth.goal.revenue_goal.toLocaleString('pt-BR')}`
                                : "Não definida"
                            }
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Projeção R$</span>
                        <span className="text-indigo-400 text-xl font-bold">
                            R$ {currentMonth.projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-orange-600/20 border border-orange-600/30 rounded-lg">
                        <span className="text-orange-300 font-medium">Projeção %</span>
                        <span className="text-orange-400 text-xl font-bold">
                            {currentMonth.revenueGoalPercent.toFixed(2)}%
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Investimento</span>
                        <div className="text-right">
                            <span className="text-white text-xl font-bold block">
                                R$ {currentMonth.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {investmentChange !== 0 && (
                                <span className={`text-sm flex items-center gap-1 justify-end mt-1 ${investmentChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {investmentChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(investmentChange).toFixed(1)}% vs mês anterior
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Transações</span>
                        <span className="text-white text-xl font-bold">
                            {currentMonth.transactions.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Previous Month */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                    {monthNames[previousMonth.month - 1]} {previousMonth.year} (Anterior)
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Receita Mês Anterior</span>
                        <div className="text-right">
                            <span className="text-white text-xl font-bold block">
                                R$ {previousMonth.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {revenueChange !== 0 && (
                                <span className={`text-sm flex items-center gap-1 justify-end mt-1 ${revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {revenueChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(revenueChange).toFixed(1)}% crescimento
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Meta Mensal Anterior</span>
                        <span className="text-white text-xl font-bold">
                            {previousMonth.goal?.revenue_goal
                                ? `R$ ${previousMonth.goal.revenue_goal.toLocaleString('pt-BR')}`
                                : "Não definida"
                            }
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Investimento</span>
                        <span className="text-white text-xl font-bold">
                            R$ {previousMonth.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className={`flex justify-between items-center p-4 rounded-lg ${previousMonth.revenueGoalPercent >= 100
                            ? 'bg-green-600/20 border border-green-600/30'
                            : 'bg-slate-800'
                        }`}>
                        <span className={previousMonth.revenueGoalPercent >= 100 ? 'text-green-300 font-medium' : 'text-slate-300 font-medium'}>
                            % Meta Atingida
                        </span>
                        <span className={`text-xl font-bold ${previousMonth.revenueGoalPercent >= 100 ? 'text-green-400' : 'text-white'
                            }`}>
                            {previousMonth.revenueGoalPercent.toFixed(2)}%
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-800 rounded-lg">
                        <span className="text-slate-300 font-medium">Transações</span>
                        <span className="text-white text-xl font-bold">
                            {previousMonth.transactions.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
