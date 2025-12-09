"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { FunnelStage } from "@/types/dashboard";

interface FunnelChartProps {
    data: FunnelStage[];
}

export function FunnelOverview({ data }: FunnelChartProps) {
    // We can simulate a funnel using a horizontal bar chart where usually people just visualize the values.
    // Or use proper Funnel from Recharts? Recharts has a Funnel chart type.
    // Let's use the actual Funnel chart for better accuracy to the request "interactive".
    // However, constructing a nice funnel visuals with custom HTML/CSS blocks is often better for "Cards" view shown in screenshot.
    // The screenshot shows stacked blocks: Sessions -> Carts -> Checkout ...
    // This is best built with HTML divs for the custom styling (orange blocks with connectors).
    // A canvas chart is harder to style exactly like the screenshot.

    return (
        <div className="flex flex-col items-center justify-center space-y-4 w-full">
            {data.map((stage, index) => {
                // Calculate relative width based on the first item (Sessions)
                const maxUsers = data[0].users;
                const widthPercentage = Math.max((stage.users / maxUsers) * 100, 20); // Min 20% width

                return (
                    <div key={stage.stage} className="relative w-full flex flex-col items-center group">
                        {/* Connector Line */}
                        {index > 0 && (
                            <div className="h-4 w-0.5 bg-slate-700 -mt-2 mb-2 z-0" />
                        )}

                        {/* Card */}
                        <div
                            className="relative z-10 bg-orange-600 rounded-lg p-3 text-center shadow-lg transition-transform transform hover:scale-105"
                            style={{ width: `${widthPercentage}%`, minWidth: '200px' }}
                        >
                            <span className="text-white text-sm font-medium block">{stage.subLabel}</span>
                            <span className="text-white text-2xl font-bold block">{stage.value}</span>
                            {stage.rate && (
                                <span className="text-white/80 text-xs block">
                                    {stage.rate > 0 ? '↑' : '↓'} {Math.abs(stage.rate)}%
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
