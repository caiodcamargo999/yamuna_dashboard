import { GA4PageSkeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Público-alvo (GA4)" />
            <main>
                <GA4PageSkeleton />
            </main>
        </>
    );
}
