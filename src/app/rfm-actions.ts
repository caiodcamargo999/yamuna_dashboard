"use server";

import { getTinyOrdersWithCustomers, getTinyOrders } from "@/lib/services/tiny";
import { getWakeOrders } from "@/lib/services/wake";
import { withCache, CACHE_TTL } from "@/lib/services/cache";
import { calculateRFM, mergeOrders, RFMScore } from "@/lib/services/customers";
import { format, subDays } from "date-fns";

/**
 * Fetch RFM Analysis Data
 * Uses getTinyOrdersWithCustomers for accurate customer data
 */
export async function fetchRFMData(months: number = 12) {
    const endDate = format(new Date(), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), months * 30), "yyyy-MM-dd");

    return withCache(`rfm:${months}m`, async () => {
        console.log(`[RFM] 📅 Fetching orders for last ${months} months`);
        console.log(`[RFM] 📅 Period: ${startDate} to ${endDate}`);

        try {
            // Use the detailed function that fetches customer info
            const [tinyOrders, wakeOrders] = await Promise.all([
                getTinyOrdersWithCustomers(startDate, endDate).catch(err => {
                    console.error(`[RFM] ❌ Error fetching Tiny orders:`, err);
                    return [];
                }),
                getWakeOrders(startDate, endDate).catch(err => {
                    console.error(`[RFM] ❌ Error fetching Wake orders:`, err);
                    return [];
                })
            ]);

            console.log(`[RFM] 📦 Tiny orders with customer data: ${tinyOrders.length}`);
            console.log(`[RFM] 📦 Wake orders: ${wakeOrders?.length || 0}`);

            // Merge orders from both sources
            const allOrders = [...tinyOrders, ...(wakeOrders || [])];

            if (allOrders.length === 0) {
                console.log(`[RFM] ⚠️ No orders found for the period`);
                return [];
            }

            // Log sample order for debugging
            if (allOrders.length > 0) {
                const sample = allOrders[0];
                console.log(`[RFM] 📋 Sample order:`, {
                    id: sample.id,
                    customerName: sample.customerName,
                    customerEmail: sample.customerEmail,
                    customerId: sample.customerId,
                    total: sample.total,
                    date: sample.date
                });
            }

            const rfmData = calculateRFM(allOrders);

            // Sort by monetary value (highest first)
            rfmData.sort((a, b) => b.monetary - a.monetary);

            console.log(`[RFM] 👥 Total customers analyzed: ${rfmData.length}`);

            // Log some stats
            const avgTicket = rfmData.reduce((sum, c) => sum + c.ticketAvg, 0) / rfmData.length;
            console.log(`[RFM] 📊 Average ticket: R$ ${avgTicket.toFixed(2)}`);

            return rfmData;
        } catch (error) {
            console.error(`[RFM] ❌ Critical error:`, error);
            return [];
        }
    }, CACHE_TTL.HOUR);
}
