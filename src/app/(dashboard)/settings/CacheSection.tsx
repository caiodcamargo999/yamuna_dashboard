"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Database, CheckCircle } from "lucide-react";
import { clearAllCaches, clearDashboardCache, getCacheStatus } from "@/app/cache-actions";

export function CacheSection() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("idle");

    async function handleClearAll() {
        setLoading(true);
        setStatus("clearing");
        try {
            const result = await clearAllCaches();
            setMessage(result.message);
            setStatus("success");

            // Auto-reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: any) {
            setMessage("Erro ao limpar cache: " + (error.message || "Erro desconhecido"));
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    async function handleClearDashboard() {
        setLoading(true);
        setStatus("clearing");
        try {
            const result = await clearDashboardCache();
            setMessage(result.message);
            setStatus("success");

            // Auto-reload after 1 second
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            setMessage("Erro ao limpar cache: " + (error.message || "Erro desconhecido"));
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                    <Database size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">Cache & Dados</h2>
            </div>
            <div className="p-6 space-y-6">
                <p className="text-sm text-slate-400">
                    Se os dados do dashboard parecerem incorretos ou desatualizados,
                    limpe o cache para forçar uma nova busca das APIs.
                </p>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${status === "success"
                            ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-400"
                            : status === "error"
                                ? "bg-red-500/10 border border-red-500/50 text-red-400"
                                : "bg-slate-800 text-slate-300"
                        }`}>
                        {status === "success" && <CheckCircle size={18} />}
                        {message}
                        {status === "success" && (
                            <span className="text-xs opacity-75 ml-2">Recarregando...</span>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleClearDashboard}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${loading
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        {loading ? "Limpando..." : "Limpar Cache Dashboard"}
                    </button>

                    <button
                        onClick={handleClearAll}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${loading
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-500 text-white"
                            }`}
                    >
                        <Trash2 size={16} />
                        {loading ? "Limpando..." : "Limpar TODO Cache"}
                    </button>
                </div>

                {/* Info */}
                <div className="text-xs text-slate-500 space-y-1">
                    <p>• <strong>Cache Dashboard:</strong> Limpa dados de métricas e KPIs</p>
                    <p>• <strong>Todo Cache:</strong> Limpa todos os dados em cache (RFM, Funil, APIs)</p>
                    <p>• Os dados serão buscados novamente das APIs após limpar</p>
                </div>
            </div>
        </div>
    );
}
