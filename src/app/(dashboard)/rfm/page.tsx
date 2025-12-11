import { Header } from "@/components/layout/Header";
import { fetchRFMData } from "@/app/rfm-actions";

// Force dynamic rendering because this page makes API calls
export const dynamic = 'force-dynamic';


export default async function RFMPage() {
    const rfmData = await fetchRFMData(12);

    // Get segment colors
    const getScoreColor = (score: number) => {
        if (score === 4) return "bg-emerald-500/20 text-emerald-400";
        if (score === 3) return "bg-blue-500/20 text-blue-400";
        if (score === 2) return "bg-yellow-500/20 text-yellow-400";
        return "bg-red-500/20 text-red-400";
    };

    return (
        <>
            <Header title="RFM - Análise de Clientes" />
            <main className="p-6 space-y-6 overflow-y-auto w-full">
                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                        <option value="">UF</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                    </select>
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                        <option value="">Recência</option>
                        <option value="4">Score 4 (Recente)</option>
                        <option value="3">Score 3</option>
                        <option value="2">Score 2</option>
                        <option value="1">Score 1 (Antigo)</option>
                    </select>
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                        <option value="">Frequência</option>
                        <option value="4">Score 4 (Alta)</option>
                        <option value="3">Score 3</option>
                        <option value="2">Score 2</option>
                        <option value="1">Score 1 (Baixa)</option>
                    </select>
                    <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm">
                        <option value="">Monetário</option>
                        <option value="4">Score 4 (Alto)</option>
                        <option value="3">Score 3</option>
                        <option value="2">Score 2</option>
                        <option value="1">Score 1 (Baixo)</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-sm mb-1">Total Clientes</p>
                        <p className="text-white text-2xl font-bold">{rfmData.length}</p>
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-xl p-4">
                        <p className="text-emerald-300 text-sm mb-1">Campeões (R≥3, F≥3, M≥3)</p>
                        <p className="text-white text-2xl font-bold">
                            {rfmData.filter(c => c.R >= 3 && c.F >= 3 && c.M >= 3).length}
                        </p>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-xl p-4">
                        <p className="text-yellow-300 text-sm mb-1">Em Risco (R≤2, F≥2)</p>
                        <p className="text-white text-2xl font-bold">
                            {rfmData.filter(c => c.R <= 2 && c.F >= 2).length}
                        </p>
                    </div>
                    <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-4">
                        <p className="text-red-300 text-sm mb-1">Hibernando (R=1, F=1)</p>
                        <p className="text-white text-2xl font-bold">
                            {rfmData.filter(c => c.R === 1 && c.F === 1).length}
                        </p>
                    </div>
                </div>

                {/* RFM Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">Clientes RFM</h3>
                        <p className="text-slate-400 text-sm">Últimos 12 meses</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nome do Cliente</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-right">Recência</th>
                                    <th className="px-4 py-3 text-right">Frequência</th>
                                    <th className="px-4 py-3 text-right">Total Gasto</th>
                                    <th className="px-4 py-3 text-right">Ticket Médio</th>
                                    <th className="px-4 py-3 text-center">R</th>
                                    <th className="px-4 py-3 text-center">F</th>
                                    <th className="px-4 py-3 text-center">M</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {rfmData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                            Nenhum cliente encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    rfmData.slice(0, 100).map((customer, i) => (
                                        <tr key={customer.customerId || i} className="hover:bg-slate-800/50">
                                            <td className="px-4 py-3 text-white font-medium">
                                                {customer.customerName || 'Cliente'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">
                                                {customer.email || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {customer.recency} dias
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {customer.frequency}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-400">
                                                R$ {customer.monetary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                R$ {customer.ticketAvg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded font-bold text-xs ${getScoreColor(customer.R)}`}>
                                                    {customer.R}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded font-bold text-xs ${getScoreColor(customer.F)}`}>
                                                    {customer.F}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded font-bold text-xs ${getScoreColor(customer.M)}`}>
                                                    {customer.M}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {rfmData.length > 100 && (
                        <div className="p-4 border-t border-slate-800 text-center text-slate-400 text-sm">
                            Mostrando 100 de {rfmData.length} clientes
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-3">Legenda RFM</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400 font-medium mb-1">R - Recência</p>
                            <p className="text-slate-500">Dias desde a última compra. Menor = Melhor (Score 4)</p>
                        </div>
                        <div>
                            <p className="text-slate-400 font-medium mb-1">F - Frequência</p>
                            <p className="text-slate-500">Total de compras realizadas. Maior = Melhor (Score 4)</p>
                        </div>
                        <div>
                            <p className="text-slate-400 font-medium mb-1">M - Monetário</p>
                            <p className="text-slate-500">Total gasto pelo cliente. Maior = Melhor (Score 4)</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
