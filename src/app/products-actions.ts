"use server";

import { getTopProductsByPeriod } from "@/lib/services/tiny-products";
import { format, subDays } from "date-fns";

export async function fetchProductsData(startDate = "2025-01-01", endDate = "today") {
    // Get actual sales from orders
    const start = startDate === "30daysAgo" ? format(subDays(new Date(), 30), "yyyy-MM-dd") : startDate;
    const end = endDate === "today" ? format(new Date(), "yyyy-MM-dd") : endDate;

    console.log(`[Products Page] 🔄 Fetching products for ${start} to ${end}`);

    // Call the service that now handles GA4 + Fallback
    const products = await getTopProductsByPeriod(start, end);

    // Map service format (GA4/Tiny) to UI format expected by page.tsx
    // The service returns: { productId, productName, revenue, quantity, itemsPurchased }
    // The UI expects: { code, name, quantity, revenue, percentage, revenuePercentage }

    // Casting to any to avoid strict type checks on mixed response types
    const totalRevenue = products.reduce((acc, p: any) => acc + (p.revenue || 0), 0);
    let accumulated = 0;

    return products.map((p: any) => {
        const rev = p.revenue || 0;
        accumulated += rev;

        return {
            code: p.productId || p.code || 'N/A', // Handle both formats
            name: p.productName || p.name || 'Unknown',
            quantity: p.itemsPurchased || p.quantity || 0,
            revenue: rev,
            revenuePercentage: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
            percentage: totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0
        };
    });
}
