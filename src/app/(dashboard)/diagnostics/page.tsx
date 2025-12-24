import { Header } from "@/components/layout/Header";
import { SystemStatus } from "@/components/diagnostics/SystemStatus";

export const dynamic = 'force-dynamic';

export default function DiagnosticsPage() {
    return (
        <>
            <Header title="Diagnóstico de Sistema" />
            <main className="p-6 overflow-y-auto w-full">
                <SystemStatus />
            </main>
        </>
    );
}
