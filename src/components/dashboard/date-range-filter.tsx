"use client";

import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateRangeFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Using date objects for the Calendar component
    const [date, setDate] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined,
    });

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const defaultEnd = new Date();
        const defaultStart = subDays(defaultEnd, 30);

        const startStr = searchParams.get("start");
        const endStr = searchParams.get("end");

        // Parse logic needed because URL params are YYYY-MM-DD strings
        // But Calendar expects Date objects
        let start = defaultStart;
        let end = defaultEnd;

        if (startStr && startStr !== '30daysAgo') {
            // Simple parsing assuming YYYY-MM-DD
            const [y, m, d] = startStr.split('-').map(Number);
            start = new Date(y, m - 1, d);
        }
        if (endStr && endStr !== 'today') {
            const [y, m, d] = endStr.split('-').map(Number);
            end = new Date(y, m - 1, d);
        }

        setDate({ from: start, to: end });
    }, [searchParams]);

    const handleApply = (newDate: { from: Date | undefined; to: Date | undefined } | undefined) => {
        if (!newDate?.from) return;

        setDate(newDate);

        // Wait for selection to finish (both dates if range) or just update visual
        // But to apply filter we generally want user to confirm or auto-apply.
        // ShadCN Calendar with mode="range" returns { from, to }

        if (newDate.from && newDate.to) {
            const startStr = format(newDate.from, "yyyy-MM-dd");
            const endStr = format(newDate.to, "yyyy-MM-dd");

            const params = new URLSearchParams(searchParams.toString());
            params.set("start", startStr);
            params.set("end", endStr);

            setIsOpen(false);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    };

    return (
        <div className="grid gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy")} -{" "}
                                    {format(date.to, "dd/MM/yyyy")}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>Selecione uma data</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleApply}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
