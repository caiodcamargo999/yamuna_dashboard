import { SourceMediumSkeleton } from "@/components/ui/Skeleton";
import { Header } from "@/components/layout/Header";

export default function Loading() {
    return (
        <>
            <Header title="Origem/Mídia (GA4)" />
            <main>
                <SourceMediumSkeleton />
            </main>
        </>
    );
}
