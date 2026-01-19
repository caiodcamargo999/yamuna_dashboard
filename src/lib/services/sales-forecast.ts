
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthlySales } from "./sales-history";

/**
 * Generates a sales forecast based on historical data.
 * Uses a weighted moving average of the last 3 months + trend adjustment.
 * 
 * @param history List of historical monthly sales
 * @param monthsToForecast Number of months to project (default 3)
 */
export function generateForecast(history: MonthlySales[], monthsToForecast: number = 3): MonthlySales[] {
    if (!history || history.length === 0) return [];

    // 1. Calculate weighted average of last 3 months (or fewer if not available)
    // Recent months have higher weight.
    const lastMonths = history.slice(-Math.min(history.length, 3));
    let weightedSum = 0;
    
    // Weights: [0.2, 0.3, 0.5] for 3 months
    const weights = [0.2, 0.3, 0.5];
    
    // Adjust weights if we have fewer months
    const activeWeights = weights.slice(-lastMonths.length);
    const weightSum = activeWeights.reduce((a, b) => a + b, 0); // Normalize to 1
    
    lastMonths.forEach((m, i) => {
        const normalizedWeight = activeWeights[i] / weightSum;
        weightedSum += m.sales * normalizedWeight;
    });

    const averageSales = Math.max(0, weightedSum); // Base level

    // 2. Calculate simple linear trend from last 6 months
    let trendFactor = 1.0;
    if (history.length >= 2) {
        const recent = history.slice(-6);
        const first = recent[0].sales;
        const last = recent[recent.length - 1].sales;
        if (first > 0) {
            const growth = (last - first) / first;
            // Dampen the trend for safety (e.g. 50% impact)
            trendFactor = 1 + (growth * 0.5); 
        }
    }

    // Clamp trend to reasonable limits (e.g. +/- 20% growth max per month implicit projection)
    trendFactor = Math.max(0.8, Math.min(1.2, trendFactor));

    const forecast: MonthlySales[] = [];
    const today = new Date(); // Assume current month is "incomplete"

    for (let i = 1; i <= monthsToForecast; i++) {
        const futureDate = addMonths(today, i);
        
        // 3. Apply Seasonality
        let seasonalMultiplier = 1.0;
        const sameMonthLastYearStr = format(subMonths(futureDate, 12), "MM");
        
        const sameMonthHistory = history.filter(h => h.rawDate.endsWith(sameMonthLastYearStr));
        if (sameMonthHistory.length > 0) {
             const seasonalAvg = sameMonthHistory.reduce((sum, h) => sum + h.sales, 0) / sameMonthHistory.length;
             const globalAvg = history.reduce((sum, h) => sum + h.sales, 0) / history.length;
             if (globalAvg > 0) {
                 seasonalMultiplier = seasonalAvg / globalAvg;
             }
        }

        // Combine factors
        // Formula: Base Weighted Avg * Trend * Seasonality
        let predictedSales = averageSales * trendFactor * seasonalMultiplier;
        
        // Ensure no negative sales
        predictedSales = Math.max(0, predictedSales);

        forecast.push({
            month: format(futureDate, "MMM", { locale: ptBR }),
            rawDate: format(futureDate, "yyyyMM"),
            sales: Math.round(predictedSales),
            revenue: 0,
            isForecast: true
        });
    }

    return forecast;
}
