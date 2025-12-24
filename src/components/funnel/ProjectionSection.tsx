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
        <div className="bg-[#0B0B1E]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-[-50%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <TrendingUp className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Projeção do Mês</h3>
                    <p className="text-slate-400 text-xs uppercase tracking-widest">
                        Baseado em {daysElapsed} dias • Faltam {daysRemaining} dias
                    </p>
                </div>
            </div>

            {/* Main Projections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                {/* Revenue Projection */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Receita Projetada</span>
                        {revenueOnTrack ? (
                            <CheckCircle className="text-emerald-500" size={16} />
                        ) : (
                            <AlertTriangle className="text-amber-500" size={16} />
                        )}
                    </div>
                    <p className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
                        R$ {projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    {revenueGoal > 0 && (
                        <>
                            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">
                                Meta: R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </p>
                            <div className="w-full bg-slate-700/30 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full shadow-sm ${revenueOnTrack ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'}`}
                                    style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                                />
                            </div>
                            <p className={`text-[10px] ${revenueOnTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {revenueProgress.toFixed(1)}% da meta
                            </p>
                        </>
                    )}
                </div>

                {/* Transactions Projection */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Transações</span>
                        {transactionsOnTrack ? (
                            <CheckCircle className="text-emerald-500" size={16} />
                        ) : (
                            <AlertTriangle className="text-amber-500" size={16} />
                        )}
                    </div>
                    <p className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
                        {projectedTransactions.toLocaleString('pt-BR')}
                    </p>
                    {transactionsGoal > 0 && (
                        <>
                            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">
                                Meta: {transactionsGoal.toLocaleString('pt-BR')}
                            </p>
                            <div className="w-full bg-slate-700/30 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full shadow-sm ${transactionsOnTrack ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'}`}
                                    style={{ width: `${Math.min(transactionsProgress, 100)}%` }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Investment / ROAS */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Investimento</span>
                        <DollarSign className="text-indigo-400" size={16} />
                    </div>
                    <p className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
                        R$ {projectedInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    {adBudgetGoal > 0 && (
                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">
                            Budget: R$ {adBudgetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                    )}
                    {projectedInvestment > 0 && (
                        <p className="text-xs text-indigo-400 font-bold bg-indigo-500/10 inline-block px-2 py-1 rounded">
                            ROAS: {(projectedRevenue / projectedInvestment).toFixed(2)}x
                        </p>
                    )}
                </div>
            </div>

            {/* Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Gap Analysis */}
                {revenueGoal > 0 && revenueGap > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <h4 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wide">
                            <Target size={14} />
                            Gap para Meta
                        </h4>
                        <p className="text-slate-300 text-sm">
                            Faltam <span className="text-white font-bold">R$ {revenueGap.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                            Necessário <span className="text-amber-400 font-semibold">R$ {additionalDailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/dia</span>
                        </p>
                    </div>
                )}

                {/* ROAS Analysis */}
                {adBudgetGoal > 0 && historicalROAS > 0 && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                        <h4 className="text-indigo-400 font-bold text-sm mb-2 flex items-center gap-2 uppercase tracking-wide">
                            <TrendingUp size={14} />
                            Análise de ROAS
                        </h4>
                        <p className="text-slate-300 text-sm">
                            Com ROAS de <span className="text-white font-bold">{historicalROAS.toFixed(2)}x</span>
                        </p>
                        <p className="text-indigo-300 font-bold mt-1 text-sm">
                            Potencial: R$ {expectedRevenueFromAds.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                )}
            </div>

            {/* Daily Metrics */}
            <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Média diária atual: R$ {dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} receita
                </p>
            </div>
        </div>
    );
}

