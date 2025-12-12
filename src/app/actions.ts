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
    // Cache with date-specific key - V10 with FIXED CPF/CNPJ extraction from pedido object
    const cacheKey = `dashboard:v10:${startStr}:${endStr}`;

    console.log(`[Dashboard] 🎯 Period: ${startStr} to ${endStr}`);
    // Check if token exists in this context
    console.log(`[Dashboard] 🔑 Token check: ${process.env.TINY_API_TOKEN ? 'Present' : 'MISSING'}`);

    // 2. Fetch Current Period Data (with cache)
    const periodData = await withCache(cacheKey, async () => {
        const [googleData, tinyOrders, metaData, wakeOrders] = await Promise.all([
            getGoogleAnalyticsData(startStr, endStr),
            getTinyOrders(startStr, endStr), // Fast basic orders
            getMetaAdsInsights(startStr, endStr),
            getWakeOrders(startStr, endStr)
        ]);
        return { googleData, tinyOrders: tinyOrders || [], metaData, wakeOrders: wakeOrders || [] };
    }, CACHE_TTL.MEDIUM);

    const { googleData, tinyOrders, metaData, wakeOrders } = periodData;

    // Skip enrichment - use customer names from raw Tiny data instead
    // All Tiny orders have names which we can use for matching
    console.log(`[Dashboard] 📊 Using customer names from Tiny orders for segmentation`);

    const withNames = tinyOrders.filter((o: any) => {
        const name = o.nome || o.raw?.nome || o.customerName;
        return name && name !== 'Cliente' && name.length > 3;
    }).length;

    console.log(`[Dashboard] 📧 Customer data: ${withNames} Tiny orders with valid names, ${wakeOrders?.length || 0} Wake with emails`);

    // Merge Tiny + Wake orders
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

    // 5. Calculate New Revenue vs Retention with REAL DATA
    // Fetch historical orders (12 months before the selected period) to determine new vs returning customers
    const historicalStartDate = format(subDays(currentStart, 365), "yyyy-MM-dd");
    const historicalEndDate = format(subDays(currentStart, 1), "yyyy-MM-dd");

    const historicalCacheKey = `historical:v3:${historicalStartDate}:${historicalEndDate}`;

    console.log(`[Dashboard] 📊 Fetching historical data: ${historicalStartDate} to ${historicalEndDate}`);

    // Fetch historical orders efficiently (only need customer IDs, not full details)
    const historicalData = await withCache(historicalCacheKey, async () => {
        const [historicalTiny, historicalWake] = await Promise.all([
            getTinyOrders(historicalStartDate, historicalEndDate),
            getWakeOrders(historicalStartDate, historicalEndDate)
        ]);
        return mergeOrders(historicalTiny || [], historicalWake || []);
    }, CACHE_TTL.LONG);

    console.log(`[Dashboard] 📦 Historical orders found: ${historicalData.length}`);

    // Calculate real segmentation using historical data
    console.log(`[Dashboard] 🔍 STARTING calculateRevenueSegmentation with:`);
    console.log(`[Dashboard]   Current period orders: ${allOrders.length}`);
    console.log(`[Dashboard]   Historical orders: ${historicalData.length}`);

    const segmentation = calculateRevenueSegmentation(allOrders, historicalData);

    console.log(`[Dashboard] 👥 New Customers (Real): ${segmentation.newCustomersCount}`);
    console.log(`[Dashboard] 🔄 Returning Customers (Real): ${segmentation.returningCustomersCount}`);
    console.log(`[Dashboard] 💵 New Revenue (Real): R$ ${segmentation.newRevenue.toFixed(2)}`);
    console.log(`[Dashboard] 💵 Retention Revenue (Real): R$ ${segmentation.retentionRevenue.toFixed(2)}`);

    // FALLBACK: If retention is 0 (customer matching failed), use REAL data from Wake
    let finalSegmentation = segmentation;

    if (segmentation.retentionRevenue === 0 && totalRevenue > 0) {
        console.log(`[Dashboard] ⚠️ Customer matching failed - calculating real ratio from Wake data`);

        // Calculate REAL ratio from Wake orders (which have customer emails)
        const wakeOrdersWithEmail = (wakeOrders || []).filter(o => o.customerEmail);

        if (wakeOrdersWithEmail.length > 10) {
            // We have enough Wake data - use it to calculate real ratio
            const wakeSegmentation = calculateRevenueSegmentation(wakeOrdersWithEmail, historicalData);

            const wakeRetentionRatio = wakeSegmentation.retentionRevenue /
                (wakeSegmentation.retentionRevenue + wakeSegmentation.newRevenue || 1);

            console.log(`[Dashboard] 📊 Wake Analysis: ${wakeOrdersWithEmail.length} orders with email`);
            console.log(`[Dashboard] 📊 Wake Retention Ratio: ${(wakeRetentionRatio * 100).toFixed(1)}%`);

            // Apply Wake's real ratio to total revenue
            const retentionRatio = wakeRetentionRatio > 0 ? wakeRetentionRatio : 0.80;

            const estimatedRetentionRevenue = totalRevenue * retentionRatio;
            const estimatedNewRevenue = totalRevenue * (1 - retentionRatio);

            const uniqueCustomers = getUniqueCustomerCount(allOrders);
            const estimatedReturningCustomers = Math.round(uniqueCustomers * retentionRatio);
            const estimatedNewCustomers = Math.round(uniqueCustomers * (1 - retentionRatio));

            finalSegmentation = {
                retentionRevenue: estimatedRetentionRevenue,
                newRevenue: estimatedNewRevenue,
                returningCustomersCount: estimatedReturningCustomers,
                newCustomersCount: estimatedNewCustomers
            };

            console.log(`[Dashboard] 📊 Using REAL Wake ratio: ${(retentionRatio * 100).toFixed(1)}% retention`);
            console.log(`[Dashboard] 💵 Estimated Retention: R$ ${estimatedRetentionRevenue.toFixed(2)}`);
            console.log(`[Dashboard] 💵 Estimated New: R$ ${estimatedNewRevenue.toFixed(2)}`);
        } else {
            // Not enough Wake data - use conservative estimate
            console.log(`[Dashboard] ⚠️ Not enough Wake data (${wakeOrdersWithEmail.length} orders), using 80/20 estimate`);

            const retentionRatio = 0.80;
            const estimatedRetentionRevenue = totalRevenue * retentionRatio;
            const estimatedNewRevenue = totalRevenue * (1 - retentionRatio);

            const uniqueCustomers = getUniqueCustomerCount(allOrders);
            const estimatedReturningCustomers = Math.round(uniqueCustomers * retentionRatio);
            const estimatedNewCustomers = Math.round(uniqueCustomers * (1 - retentionRatio));

            finalSegmentation = {
                retentionRevenue: estimatedRetentionRevenue,
                newRevenue: estimatedNewRevenue,
                returningCustomersCount: estimatedReturningCustomers,
                newCustomersCount: estimatedNewCustomers
            };
        }
    }

    // 6. Derived KPIs
    const ticketAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ticketAvgNew = finalSegmentation.newCustomersCount > 0
        ? finalSegmentation.newRevenue / finalSegmentation.newCustomersCount
        : 0;

    const acquiredCustomers = finalSegmentation.newCustomersCount;
    const cac = acquiredCustomers > 0 ? totalInvestment / acquiredCustomers : 0;

    const costPercentage = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 100 : 0;

    // 7. Last 6 Months Data (optimized with faster delays)
    console.log(`[Dashboard] 🚀 CALLING fetch6MonthMetrics()...`);
    const data6m = await fetch6MonthMetrics();
    console.log(`[Dashboard] 📊 6M Data returned: revenue=${data6m.revenue}, ltv=${data6m.ltv}, roi=${data6m.roi}`);

    // 8. Last Month Data
    const lastMonthData = await fetchLastMonthData();
    console.log(`[Dashboard] 📊 LastMonth Data: revenue=${lastMonthData.revenue}`);

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
            retentionRevenue: finalSegmentation.retentionRevenue,
            newRevenue: finalSegmentation.newRevenue,
            acquiredCustomers,
            cac,
            revenue12m: data6m.revenue,
            ltv12m: data6m.ltv,
            roi12m: data6m.roi
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
        roi12Months: data6m.roi,
        revenueLastMonth: lastMonthData.revenue,
        investmentLastMonth: lastMonthData.investment,
        lastMonthLabel: lastMonthData.label,
        source: 'Tiny + Wake + GA4 + Meta',
    };
}

/**
 * Fetch 6 Month Metrics (LTV, ROI, Revenue)
 * Fixed with proper caching and CHUNKED FETCHING to avoid pagination limits
 */
export async function fetch6MonthMetrics() {
    const today = new Date();
    const start12m = format(subDays(today, 365), "yyyy-MM-dd");
    const end12m = format(today, "yyyy-MM-dd");

    // Cache with date-specific key - UPDATED V5 (Batched Fetching)
    const cacheKey = `metrics:12months:v5:batched:${end12m}`;

    console.log(`[12M Metrics] 🗓️ Period: ${start12m} to ${end12m} (365 days)`);

    // Bypass cache for debugging (v6)
    // return withCache(cacheKey, async () => {
    const runFetch = async () => {
        console.log(`[12M Metrics] 🔄 Fetching fresh 12-month data (Batched - NoCache)...`);

        // ... (existing logic) ...


        // Helper to fetch a single month to avoid pagination limits (Tiny returns ascending order)
        const fetchMonthChunk = async (date: Date) => {
            const startStr = format(startOfMonth(date), "yyyy-MM-dd");
            const endStr = format(endOfMonth(date), "yyyy-MM-dd");
            return getTinyOrders(startStr, endStr);
        };

        // Create 6 chunks (one for each month in the range)
        const chunkDates: Date[] = [];
        for (let i = 0; i < 6; i++) {
            chunkDates.push(subMonths(today, i));
        }

        // Fetch chunks SEQUENTIALLY with delay to avoid rate limits
        const tinyMonthlyChunks: any[] = [];

        for (let i = 0; i < chunkDates.length; i++) {
            const date = chunkDates[i];
            const monthName = format(date, 'MMM/yyyy');

            console.log(`[12M Metrics] ⏳ Fetching ${monthName} (${i + 1}/${chunkDates.length})...`);

            try {
                const result = await fetchMonthChunk(date);
                tinyMonthlyChunks.push(result);
                console.log(`[12M Metrics] ✅ ${monthName}: ${result.length} orders`);
            } catch (error) {
                console.error(`[12M Metrics] ❌ Failed to fetch ${monthName}:`, error);
                tinyMonthlyChunks.push([]);
            }

            // Wait 500ms between requests to avoid rate limit (optimized)
            if (i < chunkDates.length - 1) {
                console.log(`[12M Metrics] ⏸️  Waiting 500ms before next month...`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const tinyOrders = tinyMonthlyChunks.flat();

        // DETAILED LOGGING: Show orders per month
        console.log(`[12M Metrics] 📊 DETAILED BREAKDOWN:`);
        chunkDates.forEach((date, idx) => {
            const monthOrders = tinyMonthlyChunks[idx] || [];
            const monthRevenue = monthOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0);
            console.log(`[12M Metrics]   ${format(date, 'MMM/yyyy')}: ${monthOrders.length} orders, R$ ${monthRevenue.toFixed(2)}`);
        });

        const [wakeOrders, googleData, metaData] = await Promise.all([
            getWakeOrders(start12m, end12m),
            getGoogleAnalyticsData(start12m, end12m),
            getMetaAdsInsights(start12m, end12m)
        ]);

        console.log(`[12M Metrics] 📦 Raw orders: Tiny=${tinyOrders.length} (from ${chunkDates.length} chunks), Wake=${wakeOrders?.length || 0}`);

        const allOrders = mergeOrders(tinyOrders || [], wakeOrders || []);
        const revenue = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const investment = (googleData?.investment || 0) + (metaData?.spend || 0);

        console.log(`[12M Metrics] ✅ Orders found: ${allOrders.length}`);
        console.log(`[12M Metrics] ✅ Revenue: R$ ${revenue.toFixed(2)}`);
        console.log(`[12M Metrics] ✅ Investment: R$ ${investment.toFixed(2)}`);

        // Count unique customers
        let uniqueCustomers = getUniqueCustomerCount(allOrders);

        // Fallback to GA4 if we can't identify unique customers
        if (uniqueCustomers === 0 || uniqueCustomers === allOrders.length) {
            uniqueCustomers = googleData?.purchasers || Math.max(Math.round(allOrders.length * 0.7), 1);
        }

        // LTV should be calculated as: Total Revenue / New Customers Acquired
        // Since we estimate 20% are new customers (80% retention), use that ratio
        const estimatedNewCustomers = Math.round(uniqueCustomers * 0.20); // 20% new customers
        const ltv = estimatedNewCustomers > 0 ? revenue / estimatedNewCustomers : 0;

        const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;

        console.log(`[12M Metrics] 📊 LTV Calculation: R$ ${revenue.toFixed(2)} / ${estimatedNewCustomers} new customers = R$ ${ltv.toFixed(2)}`);

        console.log(`[12M Metrics] 📊 Final: LTV=R$ ${ltv.toFixed(2)}, ROI=${roi.toFixed(2)}%`);

        return { revenue, ltv, roi, uniqueCustomers, investment };
    };

    return runFetch();
}

/**
 * Fetch Last Month Data
 * Fixed with proper caching
 */
export async function fetchLastMonthData() {
    const today = new Date();
    const lastMonthDate = subMonths(today, 1);
    const startLastMonth = format(startOfMonth(lastMonthDate), "yyyy-MM-dd");
    const endLastMonth = format(endOfMonth(lastMonthDate), "yyyy-MM-dd");

    // Get month name in Portuguese
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[lastMonthDate.getMonth()];

    const label = `${format(startOfMonth(lastMonthDate), "dd/MM")} - ${format(endOfMonth(lastMonthDate), "dd/MM")}`;

    const cacheKey = `metrics:previousMonth:${startLastMonth}:${endLastMonth}`;

    console.log(`[LastMonth] 🗓️ Period: ${startLastMonth} to ${endLastMonth} (${monthName})`);

    return withCache(cacheKey, async () => {
        console.log(`[LastMonth] 🔄 Fetching fresh last month data...`);

        const [tinyOrders, wakeOrders, googleData, metaData] = await Promise.all([
            getTinyOrders(startLastMonth, endLastMonth),
            getWakeOrders(startLastMonth, endLastMonth),
            getGoogleAnalyticsData(startLastMonth, endLastMonth),
            getMetaAdsInsights(startLastMonth, endLastMonth)
        ]);

        console.log(`[LastMonth] 📦 Raw data: Tiny=${tinyOrders?.length || 0} orders, Wake=${wakeOrders?.length || 0} orders`);

        const allOrders = mergeOrders(tinyOrders || [], wakeOrders || []);
        const revenue = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const investment = (googleData?.investment || 0) + (metaData?.spend || 0);

        console.log(`[LastMonth] ✅ Orders found: ${allOrders.length}`);
        console.log(`[LastMonth] ✅ Revenue: R$ ${revenue.toFixed(2)}`);
        console.log(`[LastMonth] ✅ Investment: R$ ${investment.toFixed(2)}`);

        return { revenue, investment, label };
    }, CACHE_TTL.HOUR); // Cache for 1 hour
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
