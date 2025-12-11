import { ProductsTableSkeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Google Ads" />
            <main>
                <ProductsTableSkeleton />
            </main>
        </>
    );
}
