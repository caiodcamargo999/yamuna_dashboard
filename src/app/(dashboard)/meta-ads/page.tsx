"use client";

import { Header } from "@/components/layout/Header";
import { Suspense } from "react";

export default function MetaAdsPage() {
    return (
        <>
            <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
                <Header title="Meta Ads - Criativos" />
            </Suspense>
            <main className="p-6 space-y-6 overflow-y-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-semibold text-white">Integração Meta Ads em Andamento</h2>
                    <p className="text-slate-400 max-w-md">
                        Nós implementamos o Google Analytics 4 e Tiny ERP com dados reais.
                        A integração com Meta Ads requer o Token de Acesso da conta, que será configurado em breve.
                    </p>
                    <div className="inline-block px-4 py-2 bg-slate-800 rounded-lg text-slate-300 text-sm">
                        Dados Reais via GA4 já estão ativos no Painel Principal.
                    </div>
                </div>
            </main>
        </>
    );
}

