"use client";

import { useState } from "react";
import { Save, Edit2 } from "lucide-react";
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
                // Refresh the page to show updated data
                window.location.reload();
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error saving goal:", error);
            alert("Erro ao salvar meta. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                        Meta de {monthNames[month - 1]} {year}
                    </h3>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Edit2 size={16} />
                        Editar Meta
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                    <div className="bg-slate-800 rounded-lg p-4 col-span-2">
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
            <h3 className="text-lg font-bold text-white mb-4">
                Editar Meta de {monthNames[month - 1]} {year}
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Meta de Receita (R$)
                    </label>
                    <input
                        type="number"
                        value={revenueGoal}
                        onChange={(e) => setRevenueGoal(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 280000"
                        step="0.01"
                    />
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Meta de Transações
                    </label>
                    <input
                        type="number"
                        value={transactionsGoal}
                        onChange={(e) => setTransactionsGoal(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 1000"
                    />
                </div>

                <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                        Orçamento de Anúncios (R$)
                    </label>
                    <input
                        type="number"
                        value={adBudgetGoal}
                        onChange={(e) => setAdBudgetGoal(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        placeholder="Ex: 50000"
                        step="0.01"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Save size={18} />
                        {saving ? "Salvando..." : "Salvar Meta"}
                    </button>
                    <button
                        onClick={() => {
                            setRevenueGoal(currentRevenueGoal);
                            setTransactionsGoal(currentTransactionsGoal);
                            setIsEditing(false);
                        }}
                        disabled={saving}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
