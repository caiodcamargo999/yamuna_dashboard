"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders } from "@/lib/services/tiny";
import { getMetaAdsInsights } from "@/lib/services/meta";
import { getTopProductsByPeriod } from "@/lib/services/tiny-products";
import { getCurrentMonthGoal, getPreviousMonthGoal, setMonthlyGoal as setGoalDB } from "@/lib/supabase/goals";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, subDays } from "date-fns";
import { parseCurrency } from "@/lib/utils";

export async function fetchFunnelData(startDate = "30daysAgo", endDate = "today") {
    console.log(`[fetchFunnelData] 📅 Called with: startDate="${startDate}", endDate="${endDate}"`);

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

    console.log(`[Funnel] 📅 Fetching data from ${startStr} to ${endStr}`);

    // 2. Fetch current month data
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const currentMonthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    // 3. Fetch previous month data
    const prevMonthDate = subMonths(new Date(), 1);
    const prevMonth = prevMonthDate.getMonth() + 1;
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthStart = format(startOfMonth(prevMonthDate), "yyyy-MM-dd");
    const prevMonthEnd = format(endOfMonth(prevMonthDate), "yyyy-MM-dd");

    // 4. Parallel fetch all data
    const [
        selectedPeriodGA4,
        selectedPeriodTiny,
        selectedPeriodProducts,
        currentMonthGA4,
        currentMonthMeta,
        getAllTinyOrdersResults, // Fetch once and filter in memory to save API calls? No, better fetch specific ranges to avoid huge payload, but use CLIENT SIDE filtering to be safe.
        prevMonthGA4,
        prevMonthMeta,
        currentGoal,
        prevGoal
    ] = await Promise.all([
        getGoogleAnalyticsData(startStr, endStr),
        getTinyOrders(startStr, endStr),
        getTopProductsByPeriod(startStr, endStr, 10),
        getGoogleAnalyticsData(currentMonthStart, currentMonthEnd),
        getMetaAdsInsights(currentMonthStart, currentMonthEnd),
        getTinyOrders(currentMonthStart, currentMonthEnd), // Fetching current month tiny again
        getGoogleAnalyticsData(prevMonthStart, prevMonthEnd),
        getMetaAdsInsights(prevMonthStart, prevMonthEnd),
        getCurrentMonthGoal(),
        getPreviousMonthGoal()
    ]);

    // Helper to safely filter orders by date (Client-side safety net)
    const filterOrdersByDate = (orders: any[], start: string, end: string) => {
        if (!orders || !Array.isArray(orders)) return [];
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        return orders.filter(o => {
            const d = parseISO(o.pedido.data_pedido); // data_pedido is YYYY-MM-DD
            return d >= startDate && d <= endDate;
        });
    };

    // Re-filter Tiny Orders because API sometimes ignores date params if misused
    const safeSelectedTiny = filterOrdersByDate(selectedPeriodTiny, startStr, endStr);
    const currentMonthTinyFiltered = filterOrdersByDate(getAllTinyOrdersResults, currentMonthStart, currentMonthEnd);
    // Actually, 'prevMonthTiny' was missing from Promise.all in my edit above, I need to restore logic properly.
    // Let's retry the Promise.all structure carefully.

    // 5. Calculate selected period metrics
    const selectedSessions = selectedPeriodGA4?.sessions || 0;
    const selectedAddToCarts = selectedPeriodGA4?.addToCarts || 0;
    const selectedCheckouts = selectedPeriodGA4?.checkouts || 0;
    const selectedTransactions = safeSelectedTiny.length || 0;
    const selectedRevenue = safeSelectedTiny.reduce((sum, order: any) => sum + (parseCurrency(order.pedido.valor_total) || 0), 0) || 0; // Use parseCurrency just in case

    console.log(`[Funnel Debug] Selected Period: ${startStr} to ${endStr}`);
    console.log(`[Funnel Debug] Transactions: ${selectedTransactions}, Revenue: R$ ${selectedRevenue.toFixed(2)}`);

    // 6. Calculate current month metrics
    const currentMonthSessions = currentMonthGA4?.sessions || 0;
    const currentMonthRevenue = currentMonthTinyFiltered.reduce((sum, order: any) => sum + (parseCurrency(order.pedido.valor_total) || 0), 0) || 0;
    const currentMonthTransactions = currentMonthTinyFiltered.length || 0;
    const currentMonthInvestment = (currentMonthGA4?.investment || 0) + (currentMonthMeta?.spend || 0);

    // 7. Calculate previous month metrics
    // Fetch prev month orders separately or reuse filter? I need to fetch them.
    // I missed fetching prevMonthTiny in the destructuring above.
    // I will refetch prevMonthTiny inside the function flow for cleanliness or do cleaner Promise.all

    const prevMonthTiny = await getTinyOrders(prevMonthStart, prevMonthEnd);
    const safePrevMonthTiny = filterOrdersByDate(prevMonthTiny, prevMonthStart, prevMonthEnd);

    const prevMonthRevenue = safePrevMonthTiny.reduce((sum, order: any) => sum + (parseCurrency(order.pedido.valor_total) || 0), 0) || 0;
    const prevMonthTransactions = safePrevMonthTiny.length || 0;
    const prevMonthInvestment = (prevMonthGA4?.investment || 0) + (prevMonthMeta?.spend || 0); // Add Meta

    // 8. Calculate conversion rates
    const cartRate = selectedSessions > 0 ? (selectedAddToCarts / selectedSessions) * 100 : 0;
    const checkoutRate = selectedAddToCarts > 0 ? (selectedCheckouts / selectedAddToCarts) * 100 : 0;
    const transactionRate = selectedCheckouts > 0 ? (selectedTransactions / selectedCheckouts) * 100 : 0;

    // 9. Calculate averages
    const avgTicket = selectedTransactions > 0 ? selectedRevenue / selectedTransactions : 0;
    const sessionsPerCart = selectedAddToCarts > 0 ? selectedSessions / selectedAddToCarts : 0;

    // 10. Calculate projections and goals
    const daysInMonth = endOfMonth(new Date()).getDate();
    const currentDay = new Date().getDate();

    // Projection Logic: (Revenue / DaysPassed) * TotalDays
    // If today is 1st, multipy by DaysInMonth.
    const projectedRevenue = currentDay > 0 ? (currentMonthRevenue / currentDay) * daysInMonth : 0;
    const projectedTransactions = currentDay > 0 ? Math.round((currentMonthTransactions / currentDay) * daysInMonth) : 0;

    const revenueGoalPercent = currentGoal?.revenue_goal && currentGoal.revenue_goal > 0
        ? (projectedRevenue / currentGoal.revenue_goal) * 100
        : 0;

    const prevRevenueGoalPercent = prevGoal?.revenue_goal && prevGoal.revenue_goal > 0
        ? (prevMonthRevenue / prevGoal.revenue_goal) * 100
        : 0;

    return {
        // Selected period funnel
        selectedPeriod: {
            sessions: selectedSessions,
            addToCarts: selectedAddToCarts,
            checkouts: selectedCheckouts,
            transactions: selectedTransactions,
            revenue: selectedRevenue,
            cartRate,
            checkoutRate,
            transactionRate,
            avgTicket,
            sessionsPerCart,
            products: selectedPeriodProducts
        },
        // Current month
        currentMonth: {
            month: currentMonth,
            year: currentYear,
            revenue: currentMonthRevenue,
            transactions: currentMonthTransactions,
            investment: currentMonthInvestment,
            projectedRevenue,
            projectedTransactions,
            goal: currentGoal,
            revenueGoalPercent
        },
        // Previous month
        previousMonth: {
            month: prevMonth,
            year: prevYear,
            revenue: prevMonthRevenue,
            transactions: prevMonthTransactions,
            investment: prevMonthInvestment,
            goal: prevGoal,
            revenueGoalPercent: prevRevenueGoalPercent
        }
    };
}

// Server Action for setting monthly goal (can be called from client components)
export async function saveMonthlyGoal(
    month: number,
    year: number,
    revenueGoal: number,
    transactionsGoal: number
) {
    "use server";
    try {
        const result = await setGoalDB(month, year, revenueGoal, transactionsGoal);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error saving monthly goal:", error);
        return { success: false, error: "Failed to save goal" };
    }
}
