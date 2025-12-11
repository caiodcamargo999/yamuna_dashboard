"use client";

import { TrendingUp, Target, DollarSign, ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";

interface ProjectionSectionProps {
    // Current month data
    currentMonthRevenue: number;
    currentMonthTransactions: number;
    currentMonthInvestment: number;
    // Goals
    revenueGoal: number;
    transactionsGoal: number;
    adBudgetGoal: number;
    // Historical averages (from previous months)
    historicalConversionRate: number; // transactions / sessions
    historicalAvgTicket: number;
    historicalROAS: number; // Revenue / Ad Spend
    // Days info
    daysElapsed: number;
    daysInMonth: number;
}

export function ProjectionSection({
    currentMonthRevenue,
    currentMonthTransactions,
    currentMonthInvestment,
    revenueGoal,
    transactionsGoal,
    adBudgetGoal,
    historicalConversionRate,
    historicalAvgTicket,
    historicalROAS,
    daysElapsed,
    daysInMonth
}: ProjectionSectionProps) {
    // Skip if no goals set
    if (revenueGoal <= 0 && transactionsGoal <= 0 && adBudgetGoal <= 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                <AlertTriangle className="text-yellow-500 mx-auto mb-3" size={32} />
                <h3 className="text-lg font-semibold text-white mb-2">Projeção Não Disponível</h3>
                <p className="text-slate-400 text-sm">
                    Defina uma meta de receita, transações ou orçamento acima para ver as projeções.
                </p>
            </div>
        );
    }

    // === PROJECTIONS CALCULATIONS ===

    // Daily averages (current month)
    const dailyRevenue = daysElapsed > 0 ? currentMonthRevenue / daysElapsed : 0;
    const dailyTransactions = daysElapsed > 0 ? currentMonthTransactions / daysElapsed : 0;
    const dailyInvestment = daysElapsed > 0 ? currentMonthInvestment / daysElapsed : 0;

    // Linear projections for end of month
    const projectedRevenue = dailyRevenue * daysInMonth;
    const projectedTransactions = Math.round(dailyTransactions * daysInMonth);
    const projectedInvestment = dailyInvestment * daysInMonth;

    // Goal achievement percentages
    const revenueProgress = revenueGoal > 0 ? (currentMonthRevenue / revenueGoal) * 100 : 0;
    const transactionsProgress = transactionsGoal > 0 ? (currentMonthTransactions / transactionsGoal) * 100 : 0;

    // Expected progress at this point in month
    const expectedProgress = (daysElapsed / daysInMonth) * 100;

    // Are we on track?
    const revenueOnTrack = revenueProgress >= expectedProgress;
    const transactionsOnTrack = transactionsProgress >= expectedProgress;

    // === INVESTMENT-BASED PROJECTIONS ===
    // Based on historical ROAS, calculate expected revenue from ad budget
    const expectedRevenueFromAds = adBudgetGoal > 0 && historicalROAS > 0
        ? adBudgetGoal * historicalROAS
        : 0;

    // Required ROAS to hit revenue goal
    const requiredROAS = adBudgetGoal > 0 ? revenueGoal / adBudgetGoal : 0;

    // === GAP ANALYSIS ===
    const revenueGap = revenueGoal - projectedRevenue;
    const daysRemaining = daysInMonth - daysElapsed;
    const additionalDailyRevenue = daysRemaining > 0 && revenueGap > 0 ? revenueGap / daysRemaining : 0;

    // === RENDER ===
    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg">
                    <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Projeção do Mês</h3>
                    <p className="text-slate-400 text-sm">
                        Baseado em {daysElapsed} dias de dados • Faltam {daysRemaining} dias
                    </p>
                </div>
            </div>

            {/* Main Projections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Revenue Projection */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Receita Projetada</span>
                        {revenueOnTrack ? (
                            <CheckCircle className="text-emerald-500" size={18} />
                        ) : (
                            <AlertTriangle className="text-amber-500" size={18} />
                        )}
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        R$ {projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    {revenueGoal > 0 && (
                        <>
                            <p className="text-xs text-slate-500 mb-2">
                                Meta: R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${revenueOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                                />
                            </div>
                            <p className={`text-xs mt-1 ${revenueOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {revenueProgress.toFixed(1)}% da meta ({expectedProgress.toFixed(0)}% esperado)
                            </p>
                        </>
                    )}
                </div>

                {/* Transactions Projection */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Transações Projetadas</span>
                        {transactionsOnTrack ? (
                            <CheckCircle className="text-emerald-500" size={18} />
                        ) : (
                            <AlertTriangle className="text-amber-500" size={18} />
                        )}
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        {projectedTransactions.toLocaleString('pt-BR')}
                    </p>
                    {transactionsGoal > 0 && (
                        <>
                            <p className="text-xs text-slate-500 mb-2">
                                Meta: {transactionsGoal.toLocaleString('pt-BR')}
                            </p>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${transactionsOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(transactionsProgress, 100)}%` }}
                                />
                            </div>
                            <p className={`text-xs mt-1 ${transactionsOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {transactionsProgress.toFixed(1)}% da meta
                            </p>
                        </>
                    )}
                </div>

                {/* Investment / ROAS */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">Investimento Projetado</span>
                        <DollarSign className="text-indigo-400" size={18} />
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                        R$ {projectedInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    {adBudgetGoal > 0 && (
                        <p className="text-xs text-slate-500 mb-2">
                            Orçamento: R$ {adBudgetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                    )}
                    {projectedInvestment > 0 && (
                        <p className="text-xs text-indigo-400">
                            ROAS Atual: {(projectedRevenue / projectedInvestment).toFixed(2)}x
                        </p>
                    )}
                </div>
            </div>

            {/* Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gap Analysis */}
                {revenueGoal > 0 && revenueGap > 0 && (
                    <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4">
                        <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                            <Target size={16} />
                            Para Atingir a Meta
                        </h4>
                        <p className="text-slate-300 text-sm">
                            Faltam <span className="text-white font-bold">R$ {revenueGap.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span> para a meta.
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            Necessário <span className="text-amber-400 font-semibold">R$ {additionalDailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/dia</span> nos próximos {daysRemaining} dias.
                        </p>
                    </div>
                )}

                {/* ROAS Analysis */}
                {adBudgetGoal > 0 && historicalROAS > 0 && (
                    <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-4">
                        <h4 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Análise de ROAS
                        </h4>
                        <p className="text-slate-300 text-sm">
                            Com ROAS histórico de <span className="text-white font-bold">{historicalROAS.toFixed(2)}x</span>,
                            o orçamento de R$ {adBudgetGoal.toLocaleString('pt-BR')} deve gerar:
                        </p>
                        <p className="text-indigo-300 font-bold mt-1">
                            R$ {expectedRevenueFromAds.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} em receita
                        </p>
                        {revenueGoal > 0 && (
                            <p className="text-slate-400 text-xs mt-2">
                                ROAS necessário para meta: <span className="text-white">{requiredROAS.toFixed(2)}x</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Daily Metrics */}
            <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs">
                    📊 Média diária atual: R$ {dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} receita •
                    {dailyTransactions.toFixed(1)} transações •
                    R$ {dailyInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} investimento
                </p>
            </div>
        </div>
    );
}
