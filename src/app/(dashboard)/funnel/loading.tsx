import { FunnelPageSkeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Funil Loja Virtual" />
            <main>
                <FunnelPageSkeleton />
            </main>
        </>
    );
}
