import { getTinyOrders } from "./tiny";

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
    const orders = await getTinyOrders(startDate, endDate);

    if (!orders || orders.length === 0) {
        return [];
    }

    // Aggregate products from all orders
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    let totalRevenue = 0;

    orders.forEach((order: any) => {
        const items = order.itens || order.items || [];

        items.forEach((item: any) => {
            const productId = item.codigo || item.id || 'unknown';
            const productName = item.descricao || item.nome || 'Produto sem nome';
            const quantity = parseInt(item.quantidade || 1);
            const unitPrice = parseFloat(item.valor_unitario || item.preco || 0);
            const itemRevenue = quantity * unitPrice;

            const existing = productMap.get(productId);
            if (existing) {
                existing.quantity += quantity;
                existing.revenue += itemRevenue;
            } else {
                productMap.set(productId, {
                    name: productName,
                    quantity,
                    revenue: itemRevenue
                });
            }

            totalRevenue += itemRevenue;
        });
    });

    // Convert to array and sort by revenue
    const products: ProductSales[] = Array.from(productMap.entries())
        .map(([id, data]) => ({
            productId: id,
            productName: data.name,
            quantity: data.quantity,
            revenue: data.revenue,
            percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

    return products;
}
