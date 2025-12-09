"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders, getTinyProducts } from "@/lib/services/tiny";
import { differenceInDays, subDays, parseISO, format } from "date-fns";

export async function fetchDashboardData(startDate = "30daysAgo", endDate = "today") {
    // Helper to calculate previous period
    let currentStart: Date;
    let currentEnd: Date;

    if (startDate === "30daysAgo") {
        currentEnd = new Date();
        currentStart = subDays(currentEnd, 30);
    } else {
        currentStart = parseISO(startDate);
        currentEnd = endDate === "today" ? new Date() : parseISO(endDate);
    }

    // Calculate previous period
    const daysDiff = differenceInDays(currentEnd, currentStart); // Get duration in days
    const prevEnd = subDays(currentStart, 1); // Prev period ends day before current starts
    const prevStart = subDays(prevEnd, daysDiff); // Prev period starts Duration days before

    // Format for APIs
    const pStartStr = format(prevStart, "yyyy-MM-dd");
    const pEndStr = format(prevEnd, "yyyy-MM-dd");

    // 1. Fetch Google Analytics for current period
    const googleData = await getGoogleAnalyticsData(startDate, endDate);

    // 2. Fetch Tiny Data for current period
    const tinyOrders = await getTinyOrders(startDate === "30daysAgo" ? undefined : startDate, endDate === "today" ? undefined : endDate);
    const tinyTotal = tinyOrders.reduce((acc, order) => acc + order.total, 0);

    // 3. Fetch Google Analytics for previous period
    const prevGoogleData = await getGoogleAnalyticsData(pStartStr, pEndStr);

    // Merge with Mocks for missing data (Wake, Meta)
    const revenue = googleData?.totalRevenue || 0;
    const sessions = googleData?.sessions || 0;
    const transactions = googleData?.transactions || 0;
    const investment = googleData?.investment || 0;

    const prevRevenue = prevGoogleData?.totalRevenue || 0;
    const prevInvestment = prevGoogleData?.investment || 0;

    return {
        revenue,
        sessions,
        transactions,
        investment,
        tinyTotalRevenue: tinyTotal,
        source: googleData ? 'GA4 (Real)' : 'Sem Dados',
        midia_source: 'Google Ads (via GA4)',
        tinySource: tinyOrders.length > 0 ? 'Tiny (Real)' : 'Sem Dados',
        dateRange: { start: startDate, end: endDate },
        previous: {
            revenue: prevRevenue,
            investment: prevInvestment,
            range: `${format(prevStart, 'dd/MM')} - ${format(prevEnd, 'dd/MM')}`
        }
    };
}

export async function fetchProductsData() {
    const products = await getTinyProducts();
    return products.map((p: any) => ({
        code: p.produto.codigo,
        name: p.produto.nome,
        revenue: parseFloat(p.produto.preco),
        quantity: 1,
        percentage: 0
    }));
}
