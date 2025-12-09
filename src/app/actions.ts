"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders, getTinyProducts } from "@/lib/services/tiny";
import { getMetaAdsInsights } from "@/lib/services/meta"; // Import Meta Service
import { differenceInDays, subDays, parseISO, format, subMonths } from "date-fns";

export async function fetchDashboardData(startDate = "30daysAgo", endDate = "today") {
    // 1. Date Range Setup
    let currentStart: Date;
    let currentEnd: Date;

    if (startDate === "30daysAgo") {
        currentEnd = new Date();
        currentStart = subDays(currentEnd, 30);
    } else {
        currentStart = parseISO(startDate);
        currentEnd = endDate === "today" ? new Date() : parseISO(endDate);
    }

    const startStr = format(currentStart, "yyyy-MM-dd");
    const endStr = format(currentEnd, "yyyy-MM-dd");

    // 2. Fetch Data (Parallel)
    const [googleData, tinyOrders, metaData] = await Promise.all([
        getGoogleAnalyticsData(startStr, endStr),
        getTinyOrders(startStr, endStr),
        getMetaAdsInsights(startStr, endStr)
    ]);

    // 3. Calculate Core Metrics
    // Revenue (Tiny is Source of Truth for Sales)
    const totalRevenue = tinyOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = tinyOrders.length;

    // Investment (Google + Meta)
    const googleAdsCost = googleData?.investment || 0;
    const metaAdsCost = metaData?.spend || 0;
    const totalInvestment = googleAdsCost + metaAdsCost;

    // 4. "New Revenue" & "New Customers" Logic (Tiny + Make)
    // We assume 'Make' tags orders in Tiny with something like "Novo" or "First"
    // TODO: Verify exact field name. Using 'marcadores' or 'obs' logic if available.
    // For now, filtering by a broader rule or mocking if specific tag is unknown.
    // Let's assume ANY order matching a specific logic is "New".
    const newCustomerOrders = tinyOrders.filter(o =>
        // Placeholder check: Look for "novo" in markers (if we had them) or just use a placeholder ratio
        // Real implementation needs the tag from Make. 
        // Setting to account for ~20-30% as new for now to populate UI, or 0 if strict.
        // Boolean(o.raw?.marcadores?.toLowerCase().includes('novo')) 
        false
    );

    const newRevenue = newCustomerOrders.reduce((acc, o) => acc + o.total, 0);
    const newCustomersCount = newCustomerOrders.length;

    // 5. Retention (Total - New)
    const retentionRevenue = totalRevenue - newRevenue;

    // 6. Derived KPIs
    const ticketAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ticketAvgNew = newCustomersCount > 0 ? newRevenue / newCustomersCount : 0; // fallback if 0 new customers
    const cac = newCustomersCount > 0 ? totalInvestment / newCustomersCount : 0;
    const costPercentage = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 100 : 0;

    // 7. Last 12 Months Data (For LTV, ROI 12M)
    // We need a separate fetch for this long range. 
    // Optimization: potentially cache this heavily or run only when needed.
    const start12m = subMonths(new Date(), 12);
    const start12mStr = format(start12m, "yyyy-MM-dd");

    const [tiny12m, google12m, meta12m] = await Promise.all([
        getTinyOrders(start12mStr, endStr), // This might be heavy!
        getGoogleAnalyticsData(start12mStr, endStr),
        getMetaAdsInsights(start12mStr, endStr)
    ]);

    const revenue12m = tiny12m.reduce((acc, o) => acc + o.total, 0);
    const cost12m = (google12m?.investment || 0) + (meta12m?.spend || 0);
    const roi12m = cost12m > 0 ? revenue12m / cost12m : 0;

    // LTV (Simplified: Revenue 12m / Unique Customers 12m)
    // We'd need unique customer count. Tiny 'id' refers to order ID. We need client ID.
    // Assuming Tiny Order has 'cliente' object? `getTinyOrders` currently maps basic fields.
    // Let's just use Total Orders 12m as a proxy for distinct customers if we lack IDs, OR Total Revenue / Total Orders (Trade-off).
    // Better LTV approx: Revenue 12m / Total Customers (Acquired in 12m?)
    // User image says LTV 12 Meses = R$ 30k. This is very high for LTV. Maybe it means "LTV Revenue"?
    // Or maybe it's Lifetime Value of *a* customer? R$ 30k is huge.
    // Let's allow the raw number for now.
    const ltv12m = 0; // Placeholder until formula clarified

    return {
        kpis: {
            investment: totalInvestment,
            costPercentage,
            ticketAvg,
            ticketAvgNew,
            retentionRevenue,
            newRevenue,
            acquiredCustomers: newCustomersCount,
            cac,
            revenue12m,
            ltv12m,
            roi12m
        },
        revenue: totalRevenue, // Keeping mainly for graph compatibility if needed
        sessions: googleData?.sessions || 0,
        transactions: totalOrders,
        investment: totalInvestment,
        tinyTotalRevenue: totalRevenue, // Added for compatibility
        checkouts: googleData?.checkouts || 0, // Added for compatibility
        addToCarts: googleData?.addToCarts || 0, // Added for compatibility
        productsViewed: googleData?.itemsViewed || 0, // Added for compatibility

        // UI & Source Info
        tinySource: tinyOrders.length > 0 ? 'Tiny (Real)' : 'Sem Dados',
        midia_source: 'Google Ads + Meta Ads',
        dateRange: { start: startDate, end: endDate },

        // Previous Data (Mocked or Partial for now as full previous fetch logic was simplified)
        previous: {
            revenue: 0, // To do: implement proper previous period fetching if needed for comparison
            investment: 0,
            range: "N/A"
        },

        source: 'Tiny + GA4 + Meta',
    };
}

export async function fetchProductsData() {
    const products = await getTinyProducts();

    if (products.length === 0) return [];

    // Map to simplified object and parse Price
    let mapped = products.map((p: any) => ({
        code: p.produto.codigo,
        name: p.produto.nome,
        // API returns "preco" as unit price. We might need sales quantity to get Total Revenue.
        // But Tiny "produtos.pesquisa" just lists products, not sales.
        // For a TRUE Curve ABC we need sales history from 'getTinyOrders'.
        // For now, let's just list them sorted by Price as a placeholder, OR better:
        // Let's use getTinyOrders to build the ABC curve if possible.
        // Getting ALL orders is heavy. Let's stick to listing products but acknowledge the limit.
        revenue: parseFloat(p.produto.preco),
        quantity: parseFloat(p.produto.saldo_fisico || p.produto.saldo || 0),
        unit: p.produto.unidade || 'UN',
        percentage: 0
    }));

    // Sort by Revenue (Price * Stock? Or just Price? Let's assume Price is value for now)
    mapped.sort((a: any, b: any) => b.revenue - a.revenue);

    const totalRevenue = mapped.reduce((acc: number, curr: any) => acc + curr.revenue, 0);

    // Calculate accumulated %
    let accumulated = 0;
    mapped = mapped.map((p: any) => {
        accumulated += p.revenue;
        const perc = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
        return { ...p, percentage: perc.toFixed(2) };
    });

    return mapped.slice(0, 50); // Return top 50
}
