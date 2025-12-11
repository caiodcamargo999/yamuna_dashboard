"use server";

/**
 * Simple localStorage-based goals storage
 * This is a fallback since Supabase table might not exist
 */

interface MonthlyGoal {
    month: number;
    year: number;
    revenue_goal: number;
    transactions_goal: number;
    ad_budget_goal: number;
}

// In-memory storage for server-side (will reset on restart)
const goalsCache = new Map<string, MonthlyGoal>();

function getGoalKey(month: number, year: number): string {
    return `${year}-${month.toString().padStart(2, '0')}`;
}

export async function saveMonthlyGoalLocal(
    month: number,
    year: number,
    revenueGoal: number,
    transactionsGoal: number,
    adBudgetGoal: number
) {
    console.log(`[Goals Local] Saving: ${month}/${year} - Revenue=${revenueGoal}, Trans=${transactionsGoal}, Budget=${adBudgetGoal}`);

    const key = getGoalKey(month, year);
    const goal: MonthlyGoal = {
        month,
        year,
        revenue_goal: revenueGoal,
        transactions_goal: transactionsGoal,
        ad_budget_goal: adBudgetGoal
    };

    goalsCache.set(key, goal);

    console.log(`[Goals Local] ✅ Saved successfully!`);
    return { success: true, data: goal };
}

export async function getMonthlyGoalLocal(month: number, year: number) {
    const key = getGoalKey(month, year);
    const goal = goalsCache.get(key);

    if (goal) {
        console.log(`[Goals Local] Found goal for ${month}/${year}`);
        return goal;
    }

    console.log(`[Goals Local] No goal found for ${month}/${year}`);
    return null;
}

export async function getCurrentMonthGoalLocal() {
    const now = new Date();
    return getMonthlyGoalLocal(now.getMonth() + 1, now.getFullYear());
}

export async function getPreviousMonthGoalLocal() {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return getMonthlyGoalLocal(prevMonth, prevYear);
}
