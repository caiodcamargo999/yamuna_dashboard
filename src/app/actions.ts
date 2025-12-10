"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders, getTinyOrdersWithCustomers } from "@/lib/services/tiny";
import { getMetaAdsInsights } from "@/lib/services/meta";
import { getWakeOrders } from "@/lib/services/wake";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/services/cache";
import {
    countFirstTimeBuyers,
    calculateRevenueSegmentation,
    getUniqueCustomerCount,
    mergeOrders,
    getCustomerId
} from "@/lib/services/customers";
import { differenceInDays, subDays, parseISO, format, subMonths, startOfMonth, endOfMonth } from "date-fns";

/**
 * Main Dashboard Data Fetcher
 * Implements correct formulas from PDF document
 */
export async function fetchDashboardData(startDate = "30daysAgo", endDate = "today") {
    console.log(`[Dashboard] 📅 Called with: startDate="${startDate}", endDate="${endDate}"`);

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
    const cacheKey = `dashboard:${startStr}:${endStr}`;

    console.log(`[Dashboard] 🎯 Period: ${startStr} to ${endStr}`);

    // 2. Fetch Current Period Data (with cache)
    const periodData = await withCache(cacheKey, async () => {
        const [googleData, tinyOrders, metaData, wakeOrders] = await Promise.all([
            getGoogleAnalyticsData(startStr, endStr),
            getTinyOrders(startStr, endStr),
            getMetaAdsInsights(startStr, endStr),
            getWakeOrders(startStr, endStr)
        ]);
        return { googleData, tinyOrders: tinyOrders || [], metaData, wakeOrders: wakeOrders || [] };
    }, CACHE_TTL.MEDIUM);

    const { googleData, tinyOrders, metaData, wakeOrders } = periodData;

    // 3. Merge Tiny + Wake orders
    // Note: Wake orders already have customer data, Tiny basic orders don't
    const allOrders = mergeOrders(tinyOrders, wakeOrders || []);
    console.log(`[Dashboard] 📦 Orders: Tiny=${tinyOrders.length}, Wake=${wakeOrders?.length || 0}, Merged=${allOrders.length}`);

    // 4. Calculate Core Metrics
    const totalRevenue = allOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalOrders = allOrders.length;

    // Investment: Google Ads + Meta Ads
    const googleAdsCost = googleData?.investment || 0;
    const metaAdsCost = metaData?.spend || 0;
    const totalInvestment = googleAdsCost + metaAdsCost;

    console.log(`[Dashboard] 💰 Revenue: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`[Dashboard] 💸 Investment: R$ ${totalInvestment.toFixed(2)} (Google: ${googleAdsCost.toFixed(2)}, Meta: ${metaAdsCost.toFixed(2)})`);

    // 5. Calculate New Revenue vs Retention
    // Wake orders have customer data, use those for segmentation
    // For orders without customer ID, we'll use GA4 newUsers ratio as fallback

    let segmentation = {
        newRevenue: 0,
        retentionRevenue: 0,
        newCustomersCount: 0,
        returningCustomersCount: 0
    };

    // Check if we have orders with customer IDs
    const ordersWithCustomerId = allOrders.filter(o => {
        const customerId = getCustomerId(o);
        return customerId && !customerId.startsWith('unknown_') && !customerId.startsWith('wake_customer_');
    });

    console.log(`[Dashboard] 🔍 Orders with customer ID: ${ordersWithCustomerId.length}/${allOrders.length}`);

    if (ordersWithCustomerId.length > 0) {
        // We have customer data - calculate properly
        console.log(`[Dashboard] ✅ Using customer-based segmentation`);

        // Get historical orders to determine who is new
        const historicalStart = "2020-01-01";
        const historicalEnd = format(subDays(currentStart, 1), "yyyy-MM-dd");

        const historicalData = await withCache(`historical:${historicalEnd}`, async () => {
            const [tinyHistorical, wakeHistorical] = await Promise.all([
                getTinyOrders(historicalStart, historicalEnd),
                getWakeOrders(historicalStart, historicalEnd)
            ]);
            return mergeOrders(tinyHistorical || [], wakeHistorical || []);
        }, CACHE_TTL.HOUR);

        console.log(`[Dashboard] 📜 Historical orders: ${historicalData.length}`);

        segmentation = calculateRevenueSegmentation(ordersWithCustomerId, historicalData);
    } else {
        // No customer IDs - use GA4 newUsers ratio as fallback
        console.log(`[Dashboard] ⚠️ No customer IDs found, using GA4 newUsers ratio`);

        const totalUsers = googleData?.purchasers || 1;
        const newUsers = googleData?.newUsers || 0;
        const newUserRatio = Math.min(newUsers / totalUsers, 1.0);

        segmentation = {
            newRevenue: totalRevenue * newUserRatio,
            retentionRevenue: totalRevenue * (1 - newUserRatio),
            newCustomersCount: Math.round(totalOrders * newUserRatio),
            returningCustomersCount: Math.round(totalOrders * (1 - newUserRatio))
        };
    }

    console.log(`[Dashboard] 👥 New Customers: ${segmentation.newCustomersCount}`);
    console.log(`[Dashboard] 🔄 Returning Customers: ${segmentation.returningCustomersCount}`);
    console.log(`[Dashboard] 💵 New Revenue: R$ ${segmentation.newRevenue.toFixed(2)}`);
    console.log(`[Dashboard] 💵 Retention Revenue: R$ ${segmentation.retentionRevenue.toFixed(2)}`);

    // 6. Derived KPIs
    const ticketAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ticketAvgNew = segmentation.newCustomersCount > 0
        ? segmentation.newRevenue / segmentation.newCustomersCount
        : 0;

    const acquiredCustomers = segmentation.newCustomersCount;
    const cac = acquiredCustomers > 0 ? totalInvestment / acquiredCustomers : 0;

    const costPercentage = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 100 : 0;

    // 7. Last 12 Months Data
    const data12m = await fetch12MonthMetrics();

    // 8. Last Month Data
    const lastMonthData = await fetchLastMonthData();

    // 9. Funnel data from GA4
    const sessions = googleData?.sessions || 0;
    const addToCarts = googleData?.addToCarts || 0;
    const checkouts = googleData?.checkouts || 0;
    const productsViewed = googleData?.itemsViewed || 0;

    return {
        kpis: {
            investment: totalInvestment,
            costPercentage,
            ticketAvg,
            ticketAvgNew,
            retentionRevenue: segmentation.retentionRevenue,
            newRevenue: segmentation.newRevenue,
            acquiredCustomers,
            cac,
            revenue12m: data12m.revenue,
            ltv12m: data12m.ltv,
            roi12m: data12m.roi
        },
        revenue: totalRevenue,
        sessions,
        transactions: totalOrders,
        investment: totalInvestment,
        tinyTotalRevenue: totalRevenue,
        checkouts,
        addToCarts,
        productsViewed,
        tinySource: allOrders.length > 0 ? 'Tiny + Wake (Real)' : 'Sem Dados',
        midia_source: 'Google Ads + Meta Ads',
        dateRange: { start: startDate, end: endDate },
        roi12Months: data12m.roi,
        revenueLastMonth: lastMonthData.revenue,
        investmentLastMonth: lastMonthData.investment,
        lastMonthLabel: lastMonthData.label,
        source: 'Tiny + Wake + GA4 + Meta',
    };
}

/**
 * Fetch 12 Month Metrics (LTV, ROI, Revenue)
 */
async function fetch12MonthMetrics() {
    const today = new Date();
    const start12m = format(subDays(today, 365), "yyyy-MM-dd");
    const end12m = format(today, "yyyy-MM-dd");

    return withCache('metrics:12m', async () => {
        console.log(`[Dashboard] 📅 Fetching 12-month data: ${start12m} to ${end12m}`);

        const [tinyOrders, wakeOrders, googleData, metaData] = await Promise.all([
            getTinyOrders(start12m, end12m),
            getWakeOrders(start12m, end12m),
            getGoogleAnalyticsData(start12m, end12m),
            getMetaAdsInsights(start12m, end12m)
        ]);

        const allOrders = mergeOrders(tinyOrders || [], wakeOrders || []);
        const revenue = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const investment = (googleData?.investment || 0) + (metaData?.spend || 0);

        // Count unique customers (using those with IDs, or estimate from GA4)
        let uniqueCustomers = getUniqueCustomerCount(allOrders);

        // If we can't identify unique customers, use GA4 purchasers as fallback
        if (uniqueCustomers === 0 || uniqueCustomers === allOrders.length) {
            uniqueCustomers = googleData?.purchasers || Math.round(allOrders.length * 0.7); // Assume 70% unique
            console.log(`[Dashboard] ⚠️ Using GA4 purchasers for LTV: ${uniqueCustomers}`);
        }

        const ltv = uniqueCustomers > 0 ? revenue / uniqueCustomers : 0;
        const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;

        console.log(`[Dashboard] 📊 12-Month Metrics:`);
        console.log(`  - Revenue: R$ ${revenue.toFixed(2)}`);
        console.log(`  - Unique Customers: ${uniqueCustomers}`);
        console.log(`  - LTV: R$ ${ltv.toFixed(2)}`);
        console.log(`  - ROI: ${roi.toFixed(2)}%`);

        return { revenue, ltv, roi, uniqueCustomers, investment };
    }, CACHE_TTL.HOUR);
}

/**
 * Fetch Last Month Data
 */
async function fetchLastMonthData() {
    const lastMonthDate = subMonths(new Date(), 1);
    const startLastMonth = format(startOfMonth(lastMonthDate), "yyyy-MM-dd");
    const endLastMonth = format(endOfMonth(lastMonthDate), "yyyy-MM-dd");
    const label = `${format(startOfMonth(lastMonthDate), "dd/MM")} - ${format(endOfMonth(lastMonthDate), "dd/MM")}`;

    return withCache('metrics:lastMonth', async () => {
        console.log(`[Dashboard] 📅 Fetching last month: ${startLastMonth} to ${endLastMonth}`);

        const [tinyOrders, wakeOrders, googleData, metaData] = await Promise.all([
            getTinyOrders(startLastMonth, endLastMonth),
            getWakeOrders(startLastMonth, endLastMonth),
            getGoogleAnalyticsData(startLastMonth, endLastMonth),
            getMetaAdsInsights(startLastMonth, endLastMonth)
        ]);

        const allOrders = mergeOrders(tinyOrders || [], wakeOrders || []);
        const revenue = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const investment = (googleData?.investment || 0) + (metaData?.spend || 0);

        return { revenue, investment, label };
    }, CACHE_TTL.LONG);
}

/**
 * Fetch Products Data for Curve ABC
 */
export async function fetchProductsData() {
    const { getTinyProducts } = await import("@/lib/services/tiny");
    const products = await getTinyProducts();

    if (products.length === 0) return [];

    let mapped = products.map((p: any) => ({
        code: p.produto.codigo,
        name: p.produto.nome,
        revenue: parseFloat(p.produto.preco),
        quantity: parseFloat(p.produto.saldo_fisico || p.produto.saldo || 0),
        unit: p.produto.unidade || 'UN',
        percentage: 0,
        classification: 'C' as 'A' | 'B' | 'C'
    }));

    mapped.sort((a: any, b: any) => b.revenue - a.revenue);

    const totalRevenue = mapped.reduce((acc: number, curr: any) => acc + curr.revenue, 0);

    let accumulated = 0;
    mapped = mapped.map((p: any) => {
        accumulated += p.revenue;
        const perc = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
        const classification = perc <= 80 ? 'A' : perc <= 95 ? 'B' : 'C';
        return { ...p, percentage: perc.toFixed(2), classification };
    });

    return mapped.slice(0, 50);
}
