
export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-700/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm animate-pulse">Carregando dados...</p>
            </div>
        </div>
    );
}
