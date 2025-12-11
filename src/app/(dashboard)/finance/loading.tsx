import { ProductsTableSkeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Indicadores Financeiros" />
            <main>
                <ProductsTableSkeleton />
            </main>
        </>
    );
}
