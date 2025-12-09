import { google } from "googleapis";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

export async function getGoogleAnalyticsData(startDate: string, endDate: string) {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !GA4_PROPERTY_ID) {
        console.warn("Missing Google Analytics Credentials");
        return null;
    }

    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    try {
        const response = await analyticsData.properties.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            requestBody: {
                dateRanges: [
                    {
                        startDate: startDate, // e.g. '2023-01-01' or '30daysAgo'
                        endDate: endDate,     // e.g. 'today'
                    },
                ],
                metrics: [
                    { name: "totalRevenue" },
                    { name: "sessions" },
                    { name: "transactions" },
                    { name: "advertiserAdCost" }, // Note: Needs google ads link for cost usually, or imported data
                ],
            },
        });

        const row = response.data.rows?.[0];

        if (!row) return null;

        return {
            totalRevenue: parseFloat(row.metricValues?.[0]?.value || "0"),
            sessions: parseInt(row.metricValues?.[1]?.value || "0"),
            transactions: parseInt(row.metricValues?.[2]?.value || "0"),
            investment: parseFloat(row.metricValues?.[3]?.value || "0"),
        };
    } catch (error) {
        console.error("Error fetching GA4 data:", error);
        return null;
    }
}
