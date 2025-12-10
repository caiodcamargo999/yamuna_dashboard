import { google } from "googleapis";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

export interface ProductSales {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    percentage: number;
}

export async function getTopProductsByPeriod(
    startDate: string,
    endDate: string,
    limit: number = 10
): Promise<ProductSales[]> {
    // 1. Try GA4 First (Much faster and provides sales data aggregation)
    if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && GA4_PROPERTY_ID) {
        try {
            console.log(`[Products] 🔄 Fetching top products from GA4...`);
            const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
            auth.setCredentials({ refresh_token: REFRESH_TOKEN });
            const analyticsData = google.analyticsdata({ version: "v1beta", auth });

            const response = await analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: "itemName" }, { name: "itemId" }],
                    metrics: [{ name: "itemRevenue" }, { name: "itemsPurchased" }],
                    limit: limit + 5 // Fetch a bit more to filter empty
                },
            } as any); // Casting to any to avoid strict type mismatch on 'limit' if library definitions are outdated

            const rows = response.data.rows || [];
            let totalRevenue = 0;

            const products: ProductSales[] = rows.map((row: any) => {
                const name = row.dimensionValues?.[0]?.value || "Unknown Product";
                const id = row.dimensionValues?.[1]?.value || "unknown";
                const revenue = parseFloat(row.metricValues?.[0]?.value || "0");
                const quantity = parseInt(row.metricValues?.[1]?.value || "0");

                totalRevenue += revenue;

                return {
                    productId: id,
                    productName: name,
                    quantity,
                    revenue,
                    percentage: 0 // Calc later
                };
            }).filter((p: ProductSales) => p.revenue > 0);

            // Re-calc percentage
            products.forEach(p => {
                p.percentage = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
            });

            // Sort by revenue
            products.sort((a, b) => b.revenue - a.revenue);

            console.log(`[Products] ✅ Found ${products.length} products via GA4`);
            return products.slice(0, limit);

        } catch (error) {
            console.error("[Products] ❌ Error fetching from GA4, returning empty:", error);
            // Fallback to empty or Tiny if implemented efficiently
            return [];
        }
    }

    console.warn("[Products] ⚠️ GA4 Credentials missing, cannot fetch top products efficiently.");
    return [];
}
