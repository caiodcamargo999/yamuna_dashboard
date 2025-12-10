import { google } from "googleapis";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

export async function getGoogleAnalyticsData(startDate: string, endDate: string) {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !GA4_PROPERTY_ID) {
        return { error: "Missing Credentials" };
    }

    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    try {
        // Request 1: Sessions (Session Scope)
        // Request 2: Events (Revenue, Transactions - Standard Metrics)
        // Request 3: Ad Cost (Ad Scope)
        // Request 4: Event Counts (View Item, Add to Cart, Begin Checkout)
        const [sessionsReport, eventsReport, adsReport, eventCountsReport] = await Promise.all([
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    metrics: [{ name: "sessions" }],
                },
            }),
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    metrics: [
                        { name: "totalRevenue" },
                        { name: "transactions" },
                        { name: "totalUsers" },
                        { name: "newUsers" },
                    ],
                },
            }),
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: "campaignName" }], // Required for ad cost
                    metrics: [{ name: "advertiserAdCost" }],
                },
            }),
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: "eventName" }],
                    metrics: [{ name: "eventCount" }],
                    dimensionFilter: {
                        filter: {
                            fieldName: "eventName",
                            inListFilter: {
                                values: ["view_item", "add_to_cart", "begin_checkout", "purchase"],
                                caseSensitive: false
                            }
                        }
                    }
                },
            }),
        ]);

        const sessionsRow = sessionsReport.data.rows?.[0];
        const events = eventsReport.data.rows?.[0]?.metricValues || [];
        const revenue = parseFloat(events[0]?.value || "0");
        const transactions = parseInt(events[1]?.value || "0");
        const users = parseInt(events[2]?.value || "0");
        const newUsers = parseInt(events[3]?.value || "0");

        // Helper to get event count
        const getEventCount = (name: string) => {
            const row = eventCountsReport.data.rows?.find((r) => r.dimensionValues?.[0].value === name);
            return parseInt(row?.metricValues?.[0].value || "0");
        };

        // Aggregate Ad Cost
        const totalInvestment = adsReport.data.rows?.reduce((acc, row) => {
            return acc + parseFloat(row.metricValues?.[0]?.value || "0");
        }, 0) || 0;

        // Get purchase count for unique purchasers approximation
        const purchaseCount = getEventCount("purchase");

        return {
            sessions: parseInt(sessionsRow?.metricValues?.[0]?.value || "0"),
            totalRevenue: revenue,
            transactions: transactions,
            purchasers: users, // Total users during period
            newUsers: newUsers,
            addToCarts: getEventCount("add_to_cart"),
            checkouts: getEventCount("begin_checkout"),
            itemsViewed: getEventCount("view_item"),
            investment: totalInvestment, // Ads spend
            roas: totalInvestment > 0 ? revenue / totalInvestment : 0
        };
    } catch (error: any) {
        console.error("Error fetching GA4 data:", error);
        return { error: error.message || JSON.stringify(error) };
    }
}
