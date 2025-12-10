import { google } from "googleapis";
import { getTinyOrders } from "./tiny";

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
            console.log(`[Products] Date range: ${startDate} to ${endDate}`);
            console.log(`[Products] GA4 Property ID: ${GA4_PROPERTY_ID}`);
            console.log(`[Products] Credentials present: CLIENT_ID=${!!CLIENT_ID}, SECRET=${!!CLIENT_SECRET}, TOKEN=${!!REFRESH_TOKEN}`);

            const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
            auth.setCredentials({ refresh_token: REFRESH_TOKEN });
            const analyticsData = google.analyticsdata({ version: "v1beta", auth });

            console.log(`[Products] 🌐 Making API request...`);

            const response = await analyticsData.properties.runReport({
                property: `properties/${GA4_PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: "itemName" }, { name: "itemId" }],
                    metrics: [{ name: "itemRevenue" }, { name: "itemsPurchased" }],
                    orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
                    limit: limit + 10 // Fetch extra to filter zeros
                },
            } as any); // Casting to any to avoid strict type mismatch on 'limit' if library definitions are outdated

            console.log(`[Products] ✅ GA4 Response received`);
            console.log(`[Products] Response status: ${response.status}`);

            const rows = response.data.rows || [];
            console.log(`[Products] 📊 Total rows from GA4: ${rows.length}`);
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

            console.log(`[Products] 💰 Total Revenue: R$ ${totalRevenue.toFixed(2)}`);
            console.log(`[Products] 📦 Products after filtering: ${products.length}`);

            // Re-calc percentage
            products.forEach(p => {
                p.percentage = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
            });

            // Sort by revenue
            products.sort((a, b) => b.revenue - a.revenue);

            console.log(`[Products] ✅ Found ${products.length} products via GA4`);
            return products.slice(0, limit);

        } catch (error: any) {
            console.error(`[Products] ❌ GA4 Error:`, error.message);
            if (error.response) {
                console.error(`[Products] Response status:`, error.response.status);
                console.error(`[Products] Response data:`, JSON.stringify(error.response.data, null, 2));
            }
            if (error.code === 'ECONNABORTED') {
                console.error(`[Products] ⏱️ Request timeout - GA4 taking too long`);
            }
            console.log(`[Products] ⚠️ Falling back to empty array`);
            return [];
        }
    }

    console.warn(`[Products] ⚠️ Missing GA4 credentials:`);
    console.warn(`  - GA4_PROPERTY_ID: ${GA4_PROPERTY_ID ? 'OK' : 'MISSING'}`);
    console.warn(`  - GOOGLE_CLIENT_ID: ${CLIENT_ID ? 'OK' : 'MISSING'}`);
    console.warn(`  - GOOGLE_CLIENT_SECRET: ${CLIENT_SECRET ? 'OK' : 'MISSING'}`);
    console.warn(`  - GOOGLE_REFRESH_TOKEN: ${REFRESH_TOKEN ? 'OK' : 'MISSING'}`);
    console.log(`[Products] ⚠️ Cannot fetch products without GA4 credentials`);
    // 2. FALLBACK: Fetch from Tiny with Item Details
    console.log(`[Products] ⚠️ GA4 method failed/skipped. Using Tiny fallback (Last 50 orders).`);

    try {
        const tinyOrders = await getTinyOrders(startDate, endDate);

        // Take latest 50 orders to avoid timeout
        const sampleOrders = tinyOrders.slice(0, 50);
        console.log(`[Products] 🐌 Fetching details for ${sampleOrders.length} orders individually...`);

        const TINY_TOKEN = process.env.TINY_TOKEN;
        const productsMap = new Map<string, { code: string; name: string; quantity: number; revenue: number }>();

        // Fetch details in parallel chunks
        const chunkSize = 5;
        for (let i = 0; i < sampleOrders.length; i += chunkSize) {
            const chunk = sampleOrders.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (order) => {
                try {
                    const url = `https://api.tiny.com.br/api2/pedido.obter.php?token=${TINY_TOKEN}&id=${order.id}&formato=json`;
                    const res = await fetch(url);
                    const data = await res.json();

                    const orderItems = data.retorno?.pedido?.itens || [];

                    orderItems.forEach((itemWrapper: any) => {
                        const item = itemWrapper.item;
                        const code = item.codigo;
                        const qty = parseFloat(item.quantidade);
                        const price = parseFloat(item.valor_unitario);
                        const revenue = qty * price;

                        if (!productsMap.has(code)) {
                            productsMap.set(code, {
                                code: code,
                                name: item.descricao,
                                quantity: 0,
                                revenue: 0
                            });
                        }

                        const p = productsMap.get(code)!;
                        p.quantity += qty;
                        p.revenue += revenue;
                    });
                } catch (err) {
                    console.error(`[Products] Error fetching order ${order.id}:`, err);
                }
            }));
        }

        const products = Array.from(productsMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .map((p, index, array) => {
                const totalRev = array.reduce((acc, curr) => acc + curr.revenue, 0);
                const accumulated = array.slice(0, index + 1).reduce((acc, curr) => acc + curr.revenue, 0);
                return {
                    productId: p.code, // Map 'code' to 'productId'
                    productName: p.name, // Map 'name' to 'productName'
                    quantity: p.quantity,
                    revenue: p.revenue,
                    percentage: (p.revenue / totalRev) * 100 // This is the individual product percentage
                };
            });

        console.log(`[Products] ✅ Fallback success: Found ${products.length} products`);
        return products.slice(0, limit); // Apply limit here

    } catch (e) {
        console.error("[Products] ❌ Tiny fallback completely failed:", e);
        return [];
    }
}
