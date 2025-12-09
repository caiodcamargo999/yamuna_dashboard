"use server";

import { getTinyOrders } from "@/lib/services/tiny";
import { format, subDays } from "date-fns";

export async function fetchProductsData(startDate = "2025-01-01", endDate = "today") {
    // Get actual sales from orders
    const start = startDate === "30daysAgo" ? format(subDays(new Date(), 30), "yyyy-MM-dd") : startDate;
    const end = endDate === "today" ? format(new Date(), "yyyy-MM-dd") : endDate;

    const orders = await getTinyOrders(start, end);

    console.log(`[Products ABC] 📦 Fetched ${orders?.length || 0} orders from ${start} to ${end}`);

    if (!orders || orders.length === 0) {
        console.log('[Products ABC] ⚠️ No orders found in the period');
        return [];
    }

    // Aggregate products from all orders
    const productSales: Record<string, { code: string; name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order: any, orderIndex: number) => {
        // Tiny returns items in 'items' array
        const items = order.items || order.itens || [];

        // Log first 2 orders to debug
        if (orderIndex < 2) {
            console.log(`[Products ABC] 📋 Order #${orderIndex + 1} structure:`, {
                hasItems: !!items,
                itemCount: items.length,
                firstItem: items[0]
            });
        }

        items.forEach((item: any) => {
            // Try multiple field name variations from Tiny API
            const code = item.codigo_produto || item.codigo || item.product_code || 'N/A';
            const name = item.descricao || item.nome_produto || item.product_name || 'Produto sem nome';
            const qty = parseFloat(item.quantidade || item.quantity || 0);
            const unitPrice = parseFloat(item.valor_unitario || item.unit_price || item.preco || 0);
            const itemRevenue = qty * unitPrice;

            if (!productSales[code]) {
                productSales[code] = {
                    code,
                    name,
                    quantity: 0,
                    revenue: 0
                };
            }

            productSales[code].quantity += qty;
            productSales[code].revenue += itemRevenue;
        });
    });

    console.log(`[Products ABC] ✅ Aggregated ${Object.keys(productSales).length} unique products`);

    // Convert to array and sort by revenue
    let products = Object.values(productSales);
    products.sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    console.log(`[Products ABC] 💰 Total Revenue: R$ ${totalRevenue.toFixed(2)}`);

    // Calculate ABC curve (accumulated percentage)
    let accumulated = 0;
    const productsWithABC = products.map((p, index) => {
        accumulated += p.revenue;
        const accPercent = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
        const revenuePercent = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;

        return {
            ...p,
            percentage: parseFloat(accPercent.toFixed(2)),
            revenuePercentage: parseFloat(revenuePercent.toFixed(2))
        };
    });

    console.log(`[Products ABC] 📊 Top 3 products:`, productsWithABC.slice(0, 3).map(p => ({
        name: p.name,
        qty: p.quantity,
        revenue: p.revenue.toFixed(2),
        percent: p.percentage
    })));

    return productsWithABC.slice(0, 50); // Top 50 products
}
