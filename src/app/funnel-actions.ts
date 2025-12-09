"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders } from "@/lib/services/tiny";
import { getTopProductsByPeriod } from "@/lib/services/tiny-products";
import { getCurrentMonthGoal, getPreviousMonthGoal, setMonthlyGoal as setGoalDB } from "@/lib/supabase/goals";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, subDays } from "date-fns";
import { parseCurrency } from "@/lib/utils";

export async function fetchFunnelData(startDate = "30daysAgo", endDate = "today") {
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
        currentMonthTiny,
        prevMonthGA4,
        prevMonthTiny,
        currentGoal,
        prevGoal
    ] = await Promise.all([
        getGoogleAnalyticsData(startStr, endStr),
        getTinyOrders(startStr, endStr),
        getTopProductsByPeriod(startStr, endStr, 10),
        getGoogleAnalyticsData(currentMonthStart, currentMonthEnd),
        getTinyOrders(currentMonthStart, currentMonthEnd),
        getGoogleAnalyticsData(prevMonthStart, prevMonthEnd),
        getTinyOrders(prevMonthStart, prevMonthEnd),
        getCurrentMonthGoal(),
        getPreviousMonthGoal()
    ]);

    // 5. Calculate selected period metrics
    const selectedSessions = selectedPeriodGA4?.sessions || 0;
    const selectedAddToCarts = selectedPeriodGA4?.addToCarts || 0;
    const selectedCheckouts = selectedPeriodGA4?.checkouts || 0;
    const selectedTransactions = selectedPeriodTiny?.length || 0;
    const selectedRevenue = selectedPeriodTiny?.reduce((sum, order: any) => sum + (order.total || 0), 0) || 0;

    console.log(`[Funnel Debug] Selected Period: ${startStr} to ${endStr}`);
    console.log(`[Funnel Debug] Transactions: ${selectedTransactions}, Revenue: R$ ${selectedRevenue.toFixed(2)}`);
    console.log(`[Funnel Debug] First 3 orders:`, selectedPeriodTiny?.slice(0, 3));

    // 6. Calculate current month metrics
    const currentMonthSessions = currentMonthGA4?.sessions || 0;
    const currentMonthRevenue = currentMonthTiny?.reduce((sum, order: any) => sum + (order.total || 0), 0) || 0;
    const currentMonthTransactions = currentMonthTiny?.length || 0;
    const currentMonthInvestment = (currentMonthGA4?.investment || 0);

    // 7. Calculate previous month metrics
    const prevMonthRevenue = prevMonthTiny?.reduce((sum, order: any) => sum + (order.total || 0), 0) || 0;
    const prevMonthTransactions = prevMonthTiny?.length || 0;
    const prevMonthInvestment = (prevMonthGA4?.investment || 0);

    // 8. Calculate conversion rates
    const cartRate = selectedSessions > 0 ? (selectedAddToCarts / selectedSessions) * 100 : 0;
    const checkoutRate = selectedAddToCarts > 0 ? (selectedCheckouts / selectedAddToCarts) * 100 : 0;
    const transactionRate = selectedCheckouts > 0 ? (selectedTransactions / selectedCheckouts) * 100 : 0;

    // 9. Calculate averages
    const avgTicket = selectedTransactions > 0 ? selectedRevenue / selectedTransactions : 0;
    const sessionsPerCart = selectedAddToCarts > 0 ? selectedSessions / selectedAddToCarts : 0;

    console.log(`[Funnel Debug] Avg Ticket Calculation: R$ ${selectedRevenue.toFixed(2)} / ${selectedTransactions} = R$ ${avgTicket.toFixed(2)}`);
    if (avgTicket > 100000) {
        console.warn(`[Funnel Warning] ⚠️ Ticket médio muito alto! Verifique dados do Tiny.`);
    }

    // 10. Calculate projections and goals
    const daysInMonth = endOfMonth(new Date()).getDate();
    const currentDay = new Date().getDate();
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
