"use client";

import { useState } from "react";
import { Save, Edit2, Target, TrendingUp, Lightbulb } from "lucide-react";
import { saveMonthlyGoal } from "@/app/funnel-actions";

interface MonthlyGoalEditorProps {
    month: number;
    year: number;
    currentRevenueGoal?: number;
    currentTransactionsGoal?: number;
    currentAdBudgetGoal?: number;
}

export function MonthlyGoalEditor({
    month,
    year,
    currentRevenueGoal = 0,
    currentTransactionsGoal = 0,
    currentAdBudgetGoal = 0
}: MonthlyGoalEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [revenueGoal, setRevenueGoal] = useState(currentRevenueGoal);
    const [transactionsGoal, setTransactionsGoal] = useState(currentTransactionsGoal);
    const [adBudgetGoal, setAdBudgetGoal] = useState(currentAdBudgetGoal);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveMonthlyGoal(month, year, revenueGoal, transactionsGoal, adBudgetGoal);

            if (result.success) {
                setIsEditing(false);
                setShowSuccess(true);

                // Hide success message after 3 seconds
                setTimeout(() => setShowSuccess(false), 3000);

                // Refresh the page to show updated data
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error saving goal:", error);
            alert("❌ Erro ao salvar meta. Verifique os valores e tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    // Calculate suggested values based on inputs
    const suggestedCostPercentage = revenueGoal > 0 && adBudgetGoal > 0
        ? ((adBudgetGoal / revenueGoal) * 100).toFixed(1)
        : null;

    const suggestedAvgTicket = revenueGoal > 0 && transactionsGoal > 0
        ? (revenueGoal / transactionsGoal).toFixed(2)
        : null;

    if (!isEditing) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
                {showSuccess && (
                    <div className="absolute -top-3 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
                        <Target size={16} />
                        Meta salva com sucesso!
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Target className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Meta de {monthNames[month - 1]} {year}
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Configure suas metas para ver projeções e análises
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Edit2 size={16} />
                        {revenueGoal > 0 ? 'Editar Meta' : 'Definir Meta'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Meta de Receita</p>
                        <p className="text-white text-2xl font-bold">
                            {revenueGoal > 0 ? `R$ ${revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não definida"}
                        </p>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Meta de Transações</p>
                        <p className="text-white text-2xl font-bold">
                            {transactionsGoal > 0 ? transactionsGoal.toLocaleString('pt-BR') : "Não definida"}
                        </p>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">Meta de Investimento (Ads)</p>
                        <p className="text-white text-2xl font-bold">
                            {adBudgetGoal > 0 ? `R$ ${adBudgetGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não definida"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-lg">
                    <Edit2 className="text-white" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                    Editar Meta de {monthNames[month - 1]} {year}
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Meta de Receita (R$) *
                    </label>
                    <input
                        type="number"
                        value={revenueGoal || ''}
                        onChange={(e) => setRevenueGoal(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 280000"
                        step="0.01"
                    />
                    <p className="text-slate-500 text-xs mt-1">Principal meta de faturamento</p>
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Meta de Transações *
                    </label>
                    <input
                        type="number"
                        value={transactionsGoal || ''}
                        onChange={(e) => setTransactionsGoal(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 1000"
                    />
                    <p className="text-slate-500 text-xs mt-1">Número de vendas esperado</p>
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Orçamento de Anúncios (R$)
                    </label>
                    <input
                        type="number"
                        value={adBudgetGoal || ''}
                        onChange={(e) => setAdBudgetGoal(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 50000"
                        step="0.01"
                    />
                    <p className="text-slate-500 text-xs mt-1">Investimento planejado em ads</p>
                </div>
            </div>

            {/* Insights */}
            {(suggestedAvgTicket || suggestedCostPercentage) && (
                <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="text-indigo-400" size={16} />
                        <h4 className="text-indigo-400 font-semibold text-sm">Insights Automáticos</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {suggestedAvgTicket && (
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-emerald-400" size={14} />
                                <span className="text-slate-300">
                                    Ticket médio necessário: <span className="text-white font-semibold">R$ {suggestedAvgTicket}</span>
                                </span>
                            </div>
                        )}
                        {suggestedCostPercentage && (
                            <div className="flex items-center gap-2">
                                <Target className="text-amber-400" size={14} />
                                <span className="text-slate-300">
                                    % Custo sobre receita: <span className="text-white font-semibold">{suggestedCostPercentage}%</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving || (revenueGoal <= 0 && transactionsGoal <= 0)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                    <Save size={18} />
                    {saving ? "Salvando..." : "Salvar Meta"}
                </button>
                <button
                    onClick={() => {
                        setRevenueGoal(currentRevenueGoal);
                        setTransactionsGoal(currentTransactionsGoal);
                        setAdBudgetGoal(currentAdBudgetGoal);
                        setIsEditing(false);
                    }}
                    disabled={saving}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors font-medium"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
