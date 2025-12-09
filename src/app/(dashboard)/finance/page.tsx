"use client";

import { Header } from "@/components/layout/Header";
import { ArrowUp, ArrowDown, DollarSign, Users, RefreshCw, ShoppingCart } from "lucide-react";

const KPI_DATA = [
    { label: "Investimento", value: "R$ 14.280,45", trend: 1.0, icon: DollarSign },
    { label: "% Custo", value: "37,73%", trend: 4.3, icon: DollarSign }, // icon?
    { label: "Ticket Médio", value: "R$ 260,35", trend: -6.8, icon: ShoppingCart },
    { label: "Ticket Médio Novos Clientes", value: "R$ 197,19", trend: 2.6, icon: ShoppingCart },
    { label: "Retenção", value: "R$ 137.826,87", trend: -12.2, icon: ShoppingCart },
    { label: "Receita Nova", value: "R$ 36.086,29", trend: 22.0, icon: ShoppingCart },
];

const CUSTOMER_DATA = [
    { label: "Clientes Adquiridos", value: "183", trend: 18.8, icon: Users },
    { label: "Custo de Aquisição (CAC)", value: "R$ 78,04", trend: -15.0, icon: Users },
];

const LTV_DATA = [
    { label: "Faturamento 12 Meses", value: "R$ 84.011", trend: 55.7 },
    { label: "LTV 12 Meses", value: "R$ 30.243,99", trend: 55.7 },
    { label: "ROI 12 Meses", value: "1,12", trend: 198.7 },
];

import { Suspense } from "react";

export default function FinancePage() {
    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Indicadores Financeiros" />
            </Suspense>
            <main className="p-6 space-y-8 overflow-y-auto w-full">

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {KPI_DATA.map((kpi, idx) => (
                        <KpiCard key={idx} {...kpi} />
                    ))}
                </div>

                {/* Customer Acquisition Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                        {CUSTOMER_DATA.map((kpi, idx) => (
                            <KpiCard key={idx} {...kpi} />
                        ))}
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                        {LTV_DATA.map((kpi, idx) => (
                            <DarkCard key={idx} {...kpi} />
                        ))}
                    </div>
                </div>

                {/* Chart Area (Static Image/Mock for now or Recharts Bar) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-slate-500">[Gráfico: Receita Retida vs Nova vs % Retenção]</p>
                    {/* 
                Explanation: The screenshot shows a mixed bar/line chart.
                Bar Stacked: Receita Retida (Dark Blue), Receita Nova (Orange).
                Line: % Retenção.
                Can be built with Recharts ComposedChart.
            */}
                </div>

            </main>
        </>
    );
}

function KpiCard({ label, value, trend, icon: Icon }: any) {
    const isPositive = trend > 0;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-center mb-2">
                <span className="text-xs text-slate-500 text-center uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-center">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                <div className={`mt-1 flex items-center justify-center text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
            </div>
        </div>
    )
}

function DarkCard({ label, value, trend }: any) {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <span className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</span>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <span className="text-xs text-emerald-400 font-medium">⬆ {trend}%</span>
        </div>
    )
}
