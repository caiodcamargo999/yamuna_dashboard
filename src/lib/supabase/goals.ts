import { createClient } from "./server";

export interface MonthlyGoal {
    id: string;
    month: number;
    year: number;
    revenue_goal: number;
    transactions_goal: number;
    created_at: string;
    updated_at: string;
}

export async function getMonthlyGoal(month: number, year: number): Promise<MonthlyGoal | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .single();

    if (error) {
        console.error(`Error fetching goal for ${month}/${year}:`, error);
        return null;
    }

    return data;
}

export async function getCurrentMonthGoal(): Promise<MonthlyGoal | null> {
    const now = new Date();
    return getMonthlyGoal(now.getMonth() + 1, now.getFullYear());
}

export async function getPreviousMonthGoal(): Promise<MonthlyGoal | null> {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return getMonthlyGoal(prevMonth, prevYear);
}

export async function setMonthlyGoal(
    month: number,
    year: number,
    revenueGoal: number,
    transactionsGoal: number
): Promise<MonthlyGoal | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('monthly_goals')
        .upsert({
            month,
            year,
            revenue_goal: revenueGoal,
            transactions_goal: transactionsGoal,
        })
        .select()
        .single();

    if (error) {
        console.error(`Error setting goal for ${month}/${year}:`, error);
        return null;
    }

    return data;
}

export async function getAllGoals(): Promise<MonthlyGoal[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

    if (error) {
        console.error('Error fetching all goals:', error);
        return [];
    }

    return data || [];
}
