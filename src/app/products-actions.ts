"use server";

import { getTopProductsByPeriod } from "@/lib/services/tiny-products";
import { format, subDays } from "date-fns";

export async function fetchProductsData(startDate = "2025-01-01", endDate = "today") {
    // Get actual sales from orders
    const start = startDate === "30daysAgo" ? format(subDays(new Date(), 30), "yyyy-MM-dd") : startDate;
    const end = endDate === "today" ? format(new Date(), "yyyy-MM-dd") : endDate;

    // Calculate Previous Period
    const daysDiff = Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
    const prevEnd = format(subDays(new Date(start), 1), "yyyy-MM-dd");
    const prevStart = format(subDays(new Date(start), daysDiff + 1), "yyyy-MM-dd");

    console.log(`[Products Page] 🔄 Fetching products for Current: ${start}-${end} | Previous: ${prevStart}-${prevEnd}`);

    // Fetch Current and Previous period data in parallel
    const [products, prevProducts] = await Promise.all([
        getTopProductsByPeriod(start, end),
        getTopProductsByPeriod(prevStart, prevEnd)
    ]);

    // Map previous products for easy lookup
    const prevProductsMap = new Map(prevProducts.map(p => [p.productId, p.revenue]));

    // Map service format (GA4/Tiny) to UI format expected by page.tsx
    // The service returns: { productId, productName, revenue, quantity, itemsPurchased }
    // The UI expects: { code, name, quantity, revenue, percentage, revenuePercentage, trend }

    // Casting to any to avoid strict type checks on mixed response types
    const totalRevenue = products.reduce((acc, p: any) => acc + (p.revenue || 0), 0);
    let accumulated = 0;

    return products.map((p: any) => {
        const rev = p.revenue || 0;
        accumulated += rev;

        // Trend Calculation
        const prevRev = prevProductsMap.get(p.productId) || 0;
        let trendValue = 0;
        let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';

        if (prevRev > 0) {
            trendValue = ((rev - prevRev) / prevRev) * 100;
        } else if (rev > 0) {
            trendValue = 100; // New product or started selling
        }

        if (trendValue > 0.5) trendDirection = 'up';
        else if (trendValue < -0.5) trendDirection = 'down';

        return {
            code: p.productId || p.code || 'N/A', // Handle both formats
            name: p.productName || p.name || 'Unknown',
            quantity: p.itemsPurchased || p.quantity || 0,
            revenue: rev,
            revenuePercentage: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
            percentage: totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0,
            trend: {
                value: Math.abs(trendValue),
                direction: trendDirection
            }
        };
    });
}
