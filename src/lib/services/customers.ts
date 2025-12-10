/**
 * Customer Analysis Service
 * Handles customer segmentation, RFM, and revenue attribution
 */

import { differenceInDays, parseISO } from "date-fns";

export interface CustomerOrder {
    id: string;
    customerId: string;
    customerEmail?: string;
    orderDate: string;
    total: number;
}

export interface CustomerSegmentation {
    newRevenue: number;
    retentionRevenue: number;
    newCustomersCount: number;
    returningCustomersCount: number;
}

export interface RFMScore {
    customerId: string;
    customerName?: string;
    email?: string;
    recency: number;      // Days since last purchase
    frequency: number;    // Total number of orders
    monetary: number;     // Total spent
    R: number;            // Recency score 1-4
    F: number;            // Frequency score 1-4
    M: number;            // Monetary score 1-4
    ticketAvg: number;    // Average order value
}

/**
 * Extract customer ID from order (handles multiple formats)
 * Priority: explicit customerId > cliente data > email > fallback
 */
export function getCustomerId(order: any): string {
    // First check if it's a normalized order (Wake or enriched Tiny)
    if (order.customerId && !order.customerId.startsWith('unknown_') && !order.customerId.startsWith('wake_customer_')) {
        return order.customerId;
    }

    // Check for email first (most reliable identifier)
    if (order.customerEmail && order.customerEmail.includes('@')) {
        return order.customerEmail.toLowerCase();
    }

    // Try legacy field names
    const email =
        order.email ||
        order.cliente?.email ||
        order.raw?.cliente?.email;

    if (email && email.includes('@')) {
        return email.toLowerCase();
    }

    // Try other ID fields
    const clienteId =
        order.cliente_id ||
        order.customer_id ||
        order.raw?.cliente?.codigo ||
        order.raw?.cliente?.id ||
        order.raw?.id_cliente;

    if (clienteId) {
        return clienteId.toString();
    }

    // Last resort: use customerId even if it's a fallback
    if (order.customerId) {
        return order.customerId;
    }

    // Final fallback
    return `unknown_${order.id || order.numero || Math.random()}`;
}

/**
 * Extract customer name from order
 */
export function getCustomerName(order: any): string {
    return (
        order.customerName ||
        order.cliente_nome ||
        order.customer_name ||
        order.nome ||
        order.cliente?.nome ||
        order.raw?.cliente?.nome ||
        'Cliente'
    );
}

/**
 * Extract customer email from order
 */
export function getCustomerEmail(order: any): string {
    return (
        order.email ||
        order.cliente?.email ||
        order.raw?.cliente?.email ||
        order.customer_email ||
        ''
    );
}

/**
 * Extract customer phone from order
 */
export function getCustomerPhone(order: any): string {
    return (
        order.telefone ||
        order.cliente?.fone ||
        order.raw?.cliente?.fone ||
        order.phone ||
        ''
    );
}

/**
 * Parse order date to Date object
 */
export function parseOrderDate(order: any): Date {
    const dateStr = order.date || order.data_pedido || order.orderDate;
    if (!dateStr) return new Date();

    // Handle dd/MM/yyyy format
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }

    // Handle ISO format
    return parseISO(dateStr);
}

/**
 * Count first-time buyers in the period
 * This is the CORRECT way to calculate "Clientes Adquiridos"
 */
export function countFirstTimeBuyers(
    currentPeriodOrders: any[],
    historicalOrders: any[]
): number {
    // Create set of existing customers (before current period)
    const existingCustomers = new Set<string>();
    historicalOrders.forEach(order => {
        const customerId = getCustomerId(order);
        if (customerId) existingCustomers.add(customerId);
    });

    // Count unique new customers in current period
    const newCustomerIds = new Set<string>();
    currentPeriodOrders.forEach(order => {
        const customerId = getCustomerId(order);
        if (customerId && !existingCustomers.has(customerId)) {
            newCustomerIds.add(customerId);
        }
    });

    return newCustomerIds.size;
}

/**
 * Calculate revenue segmentation (New vs Retention)
 * According to PDF: Receita_Nova = SUM(receita WHERE cliente_primeira_compra == período)
 */
export function calculateRevenueSegmentation(
    currentPeriodOrders: any[],
    historicalOrders: any[]
): CustomerSegmentation {
    // Create set of existing customers
    const existingCustomers = new Set<string>();
    historicalOrders.forEach(order => {
        const customerId = getCustomerId(order);
        if (customerId) existingCustomers.add(customerId);
    });

    let newRevenue = 0;
    let retentionRevenue = 0;
    const newCustomerIds = new Set<string>();
    const returningCustomerIds = new Set<string>();

    currentPeriodOrders.forEach(order => {
        const customerId = getCustomerId(order);
        const orderValue = order.total || 0;

        if (existingCustomers.has(customerId)) {
            // Returning customer
            retentionRevenue += orderValue;
            returningCustomerIds.add(customerId);
        } else {
            // New customer
            newRevenue += orderValue;
            newCustomerIds.add(customerId);
        }
    });

    return {
        newRevenue,
        retentionRevenue,
        newCustomersCount: newCustomerIds.size,
        returningCustomersCount: returningCustomerIds.size
    };
}

/**
 * Get unique customer count from orders
 */
export function getUniqueCustomerCount(orders: any[]): number {
    const uniqueCustomers = new Set<string>();
    orders.forEach(order => {
        const customerId = getCustomerId(order);
        if (customerId) uniqueCustomers.add(customerId);
    });
    return uniqueCustomers.size;
}

/**
 * Calculate RFM scores for all customers
 * R = Days since last purchase (lower is better)
 * F = Number of orders (higher is better)
 * M = Total monetary value (higher is better)
 */
export function calculateRFM(orders: any[]): RFMScore[] {
    const today = new Date();

    // Group orders by customer
    const customerData = new Map<string, {
        name: string;
        email: string;
        phone: string;
        lastOrderDate: Date;
        orderCount: number;
        totalSpent: number;
    }>();

    orders.forEach(order => {
        const customerId = getCustomerId(order);
        const orderDate = parseOrderDate(order);
        const orderValue = order.total || 0;

        if (!customerData.has(customerId)) {
            customerData.set(customerId, {
                name: getCustomerName(order),
                email: getCustomerEmail(order),
                phone: getCustomerPhone(order),
                lastOrderDate: orderDate,
                orderCount: 0,
                totalSpent: 0
            });
        }

        const data = customerData.get(customerId)!;
        data.orderCount++;
        data.totalSpent += orderValue;
        if (orderDate > data.lastOrderDate) {
            data.lastOrderDate = orderDate;
        }
    });

    // Convert to RFM data
    const rfmData: RFMScore[] = Array.from(customerData.entries()).map(([customerId, data]) => ({
        customerId,
        customerName: data.name,
        email: data.email,
        recency: differenceInDays(today, data.lastOrderDate),
        frequency: data.orderCount,
        monetary: data.totalSpent,
        R: 0, // Calculated below
        F: 0,
        M: 0,
        ticketAvg: data.orderCount > 0 ? data.totalSpent / data.orderCount : 0
    }));

    // Calculate quantiles (1-4 scores)
    const recencyValues = rfmData.map(r => r.recency).sort((a, b) => a - b);
    const frequencyValues = rfmData.map(r => r.frequency).sort((a, b) => a - b);
    const monetaryValues = rfmData.map(r => r.monetary).sort((a, b) => a - b);

    rfmData.forEach(customer => {
        // For Recency: lower is better, so we invert the score
        customer.R = 5 - getQuartile(customer.recency, recencyValues);
        // For Frequency and Monetary: higher is better
        customer.F = getQuartile(customer.frequency, frequencyValues);
        customer.M = getQuartile(customer.monetary, monetaryValues);

        // Ensure scores are in 1-4 range
        customer.R = Math.max(1, Math.min(4, customer.R));
        customer.F = Math.max(1, Math.min(4, customer.F));
        customer.M = Math.max(1, Math.min(4, customer.M));
    });

    return rfmData;
}

/**
 * Helper: Get quartile (1-4) for a value in sorted array
 */
function getQuartile(value: number, sortedArray: number[]): number {
    const n = sortedArray.length;
    if (n === 0) return 2;

    const index = sortedArray.findIndex(v => v >= value);
    const position = index === -1 ? n : index;
    const percentile = position / n;

    if (percentile <= 0.25) return 1;
    if (percentile <= 0.50) return 2;
    if (percentile <= 0.75) return 3;
    return 4;
}

/**
 * Merge orders from multiple sources (Tiny + Wake), removing duplicates
 */
export function mergeOrders(tinyOrders: any[], wakeOrders: any[]): any[] {
    const orderMap = new Map<string, any>();

    // Add Tiny orders
    tinyOrders.forEach(order => {
        const id = order.id || order.numero;
        if (id) orderMap.set(`tiny_${id}`, order);
    });

    // Add Wake orders (may have different ID format)
    wakeOrders.forEach(order => {
        const id = order.id || order.pedidoId || order.numero;
        if (id) orderMap.set(`wake_${id}`, order);
    });

    return Array.from(orderMap.values());
}
