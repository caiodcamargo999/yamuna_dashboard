/**
 * Google Analytics 4 - Extended Reports
 * Público-alvo (Demographics) and Origem/Mídia (Source/Medium)
 */

import { google } from "googleapis";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// Helper to create authenticated client
function getAnalyticsClient() {
    if (!GA4_PROPERTY_ID || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        return null;
    }
    const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    auth.setCredentials({ refresh_token: REFRESH_TOKEN });
    return google.analyticsdata({ version: "v1beta", auth });
}

// Safe date helper
function getSafeEndDate(endDate: string): string {
    const todayStr = new Date().toISOString().split('T')[0];
    return endDate > todayStr ? todayStr : endDate;
}

export interface RegionData {
    region: string;
    sessions: number;
    sessionsChange: number;
    purchases: number;
    purchasesChange: number;
    revenue: number;
    revenueChange: number;
    conversionRate: number;
}

export interface CityData {
    city: string;
    sessions: number;
    sessionsChange: number;
    purchases: number;
    purchasesChange: number;
    revenue: number;
    revenueChange: number;
    conversionRate: number;
}

export interface AgeData {
    age: string;
    sessions: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
}

export interface SourceMediumData {
    source: string;
    medium: string;
    landingPage: string;
    sessions: number;
    sessionsChange: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
    revenueChange: number;
    conversionRate: number;
    avgRevenue: number;
    avgSessionDuration: number;
}

/**
 * Fetch Público-alvo (Demographics) data
 * Regions, Cities, and Age groups
 */
export async function getGA4Demographics(startDate: string, endDate: string) {
    const analyticsData = getAnalyticsClient();
    if (!analyticsData) {
        console.error('[GA4 Demographics] Missing credentials');
        return null;
    }

    const safeEndDate = getSafeEndDate(endDate);
    console.log(`[GA4 Demographics] Fetching data from ${startDate} to ${safeEndDate}`);

    try {
        // Parallel requests for regions, cities, and age
        const [regionsReport, citiesReport, ageReport] = await Promise.all([
            // Regions (States)
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate: safeEndDate }],
                    dimensions: [{ name: "region" }],
                    metrics: [
                        { name: "sessions" },
                        { name: "ecommercePurchases" },
                        { name: "totalRevenue" }
                    ],
                    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                    limit: "20"
                }
            }),
            // Cities
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate: safeEndDate }],
                    dimensions: [{ name: "city" }],
                    metrics: [
                        { name: "sessions" },
                        { name: "ecommercePurchases" },
                        { name: "totalRevenue" }
                    ],
                    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                    limit: "20"
                }
            }),
            // Age groups
            analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate: safeEndDate }],
                    dimensions: [{ name: "userAgeBracket" }],
                    metrics: [
                        { name: "sessions" },
                        { name: "ecommercePurchases" },
                        { name: "totalRevenue" }
                    ],
                    orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
                }
            })
        ]);

        // Parse regions
        const regions: RegionData[] = (regionsReport.data.rows || []).map((row: any) => {
            const sessions = parseInt(row.metricValues?.[0]?.value || "0");
            const purchases = parseInt(row.metricValues?.[1]?.value || "0");
            const revenue = parseFloat(row.metricValues?.[2]?.value || "0");
            return {
                region: row.dimensionValues?.[0]?.value || "Unknown",
                sessions,
                sessionsChange: 0, // Would need comparison period
                purchases,
                purchasesChange: 0,
                revenue,
                revenueChange: 0,
                conversionRate: sessions > 0 ? (purchases / sessions) * 100 : 0
            };
        });

        // Parse cities
        const cities: CityData[] = (citiesReport.data.rows || []).map((row: any) => {
            const sessions = parseInt(row.metricValues?.[0]?.value || "0");
            const purchases = parseInt(row.metricValues?.[1]?.value || "0");
            const revenue = parseFloat(row.metricValues?.[2]?.value || "0");
            return {
                city: row.dimensionValues?.[0]?.value || "Unknown",
                sessions,
                sessionsChange: 0,
                purchases,
                purchasesChange: 0,
                revenue,
                revenueChange: 0,
                conversionRate: sessions > 0 ? (purchases / sessions) * 100 : 0
            };
        });

        // Parse age groups
        const ageGroups: AgeData[] = (ageReport.data.rows || []).map((row: any) => {
            const sessions = parseInt(row.metricValues?.[0]?.value || "0");
            const purchases = parseInt(row.metricValues?.[1]?.value || "0");
            const revenue = parseFloat(row.metricValues?.[2]?.value || "0");
            return {
                age: row.dimensionValues?.[0]?.value || "unknown",
                sessions,
                purchases,
                revenue,
                conversionRate: sessions > 0 ? (purchases / sessions) * 100 : 0
            };
        });

        // Calculate totals
        const totalSessions = regions.reduce((sum, r) => sum + r.sessions, 0);
        const totalPurchases = regions.reduce((sum, r) => sum + r.purchases, 0);
        const totalRevenue = regions.reduce((sum, r) => sum + r.revenue, 0);

        console.log(`[GA4 Demographics] Found ${regions.length} regions, ${cities.length} cities, ${ageGroups.length} age groups`);

        return {
            regions,
            cities,
            ageGroups,
            totals: {
                sessions: totalSessions,
                purchases: totalPurchases,
                revenue: totalRevenue,
                conversionRate: totalSessions > 0 ? (totalPurchases / totalSessions) * 100 : 0
            }
        };
    } catch (error: any) {
        console.error("[GA4 Demographics] Error:", error.message);
        return null;
    }
}

/**
 * Fetch Origem/Mídia (Source/Medium) data
 */
export async function getGA4SourceMedium(startDate: string, endDate: string) {
    const analyticsData = getAnalyticsClient();
    if (!analyticsData) {
        console.error('[GA4 Source/Medium] Missing credentials');
        return null;
    }

    const safeEndDate = getSafeEndDate(endDate);
    console.log(`[GA4 Source/Medium] Fetching data from ${startDate} to ${safeEndDate}`);

    try {
        const report = await analyticsData.properties.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate, endDate: safeEndDate }],
                dimensions: [
                    { name: "sessionSource" },
                    { name: "sessionMedium" },
                    { name: "landingPage" }
                ],
                metrics: [
                    { name: "sessions" },
                    { name: "addToCarts" },
                    { name: "ecommercePurchases" },
                    { name: "totalRevenue" },
                    { name: "averageSessionDuration" }
                ],
                orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                limit: "50"
            }
        });

        const data: SourceMediumData[] = (report.data.rows || []).map((row: any) => {
            const sessions = parseInt(row.metricValues?.[0]?.value || "0");
            const addToCarts = parseInt(row.metricValues?.[1]?.value || "0");
            const purchases = parseInt(row.metricValues?.[2]?.value || "0");
            const revenue = parseFloat(row.metricValues?.[3]?.value || "0");
            const avgDuration = parseFloat(row.metricValues?.[4]?.value || "0");

            return {
                source: row.dimensionValues?.[0]?.value || "(direct)",
                medium: row.dimensionValues?.[1]?.value || "(none)",
                landingPage: row.dimensionValues?.[2]?.value || "/",
                sessions,
                sessionsChange: 0,
                addToCarts,
                purchases,
                revenue,
                revenueChange: 0,
                conversionRate: sessions > 0 ? (purchases / sessions) * 100 : 0,
                avgRevenue: purchases > 0 ? revenue / purchases : 0,
                avgSessionDuration: avgDuration
            };
        });

        // Calculate totals
        const totalSessions = data.reduce((sum, r) => sum + r.sessions, 0);
        const totalAddToCarts = data.reduce((sum, r) => sum + r.addToCarts, 0);
        const totalPurchases = data.reduce((sum, r) => sum + r.purchases, 0);
        const totalRevenue = data.reduce((sum, r) => sum + r.revenue, 0);

        console.log(`[GA4 Source/Medium] Found ${data.length} source/medium combinations`);

        return {
            data,
            totals: {
                sessions: totalSessions,
                addToCarts: totalAddToCarts,
                purchases: totalPurchases,
                revenue: totalRevenue,
                conversionRate: totalSessions > 0 ? (totalPurchases / totalSessions) * 100 : 0
            }
        };
    } catch (error: any) {
        console.error("[GA4 Source/Medium] Error:", error.message);
        return null;
    }
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
