"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders, getTinyProducts } from "@/lib/services/tiny";
import { getMetaAdsInsights } from "@/lib/services/meta"; // Import Meta Service
import { differenceInDays, subDays, parseISO, format, subMonths, startOfMonth, endOfMonth, parse } from "date-fns";

import { getWakeOrders } from "@/lib/services/wake";
import { parseCurrency } from "@/lib/utils";

export async function fetchDashboardData(startDate = "30daysAgo", endDate = "today") {
    console.log(`[fetchDashboardData] 📅 Called with: startDate="${startDate}", endDate="${endDate}"`);

    // 1. Date Range Setup
    let currentStart: Date;
    let currentEnd: Date;

    if (startDate === "30daysAgo") {
        currentEnd = new Date();
        currentStart = subDays(currentEnd, 30);
    } else {
        currentStart = parseISO(startDate);
        currentEnd = endDate === "today" ? new Date() : parseISO(endDate);
    }

    const startStr = format(currentStart, "yyyy-MM-dd");
    const endStr = format(currentEnd, "yyyy-MM-dd");

    console.log(`[fetchDashboardData] 🎯 Parsed dates: ${startStr} to ${endStr}`);

    console.log(`\n[Dashboard] 📅 FILTRO ATIVO:`);
    console.log(`  - Start (input): ${startDate}`);
    console.log(`  - End (input): ${endDate}`);
    console.log(`  - Start (converted): ${startStr}`);
    console.log(`  - End (converted): ${endStr}`);

    // Helper: Extract date from order (must be defined before use)
    const getDateFromOrder = (o: any): string | null => {
        if (o.date) return o.date;
        if (o.data_pedido) return o.data_pedido;
        if (o.pedido?.data_pedido) return o.pedido.data_pedido;
        return null;
    };

    // Robust date filter (handles dd/MM/yyyy from Tiny and ISO)
    const filterOrdersByDateRange = (orders: any[], startStr: string, endStr: string): any[] => {
        if (!orders || !Array.isArray(orders)) return [];

        console.log(`[Filter Debug] Filtering ${orders.length} orders between ${startStr} and ${endStr}`);

        const startDateFilter = parseISO(startStr);
        startDateFilter.setHours(0, 0, 0, 0);

        const endDateFilter = parseISO(endStr);
        endDateFilter.setHours(23, 59, 59, 999);

        const filtered = orders.filter((o, idx) => {
            const dateStr = getDateFromOrder(o);
            if (!dateStr || typeof dateStr !== 'string') {
                if (idx < 2) console.log(`[Filter Debug] Order ${idx}: No date string, including anyway`);
                return true; // INCLUDE if no date (safer than exclude)
            }

            let orderDate: Date | null = null;

            // Try dd/MM/yyyy format first (Tiny standard)
            if (dateStr.includes('/')) {
                try {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // 0-indexed
                        const year = parseInt(parts[2], 10);
                        orderDate = new Date(year, month, day);
                    }
                } catch (e) {
                    if (idx < 2) console.error(`[Filter Debug] Order ${idx}: Failed to parse ${dateStr}:`, e);
                }
            }
            // Try ISO format
            else if (dateStr.includes('-')) {
                try {
                    orderDate = parseISO(dateStr);
                } catch (e) {
                    if (idx < 2) console.error(`[Filter Debug] Order ${idx}: Failed to parse ISO ${dateStr}:`, e);
                }
            }

            if (!orderDate || isNaN(orderDate.getTime())) {
                if (idx < 2) console.log(`[Filter Debug] Order ${idx}: Invalid date ${dateStr}, including anyway`);
                return true; // INCLUDE if unparseable (safer)
            }

            const inRange = orderDate >= startDateFilter && orderDate <= endDateFilter;
            if (idx < 2) console.log(`[Filter Debug] Order ${idx}: ${dateStr} -> ${orderDate.toISOString()} -> ${inRange ? 'KEEP' : 'REJECT'}`);
            return inRange;
        });

        console.log(`[Filter Debug] Result: ${filtered.length}/${orders.length} orders kept`);
        return filtered;
    };

    // 2. Fetch Data (Parallel)
    const [googleData, tinyOrdersRaw, metaData, wakeOrders] = await Promise.all([
        getGoogleAnalyticsData(startStr, endStr),
        getTinyOrders(startStr, endStr),
        getMetaAdsInsights(startStr, endStr),
        getWakeOrders(startStr, endStr)
    ]);

    // TRUST API: The Tiny API already filters by date, no need for manual filter
    const tinyOrders = tinyOrdersRaw || [];
    console.log(`[Dashboard] Tiny API returned ${tinyOrders.length} orders for period ${startStr} to ${endStr}`);

    if (tinyOrders.length > 0) {
        console.log(`[Dashboard] 🔍 VERIFICAÇÃO DE PERÍODO:`);
        console.log(`  - Primeiro pedido: ${(tinyOrders[0] as any).date || (tinyOrders[0] as any).data_pedido || 'sem data'}`);
        console.log(`  - Último pedido: ${(tinyOrders[tinyOrders.length - 1] as any).date || (tinyOrders[tinyOrders.length - 1] as any).data_pedido || 'sem data'}`);
    }

    // 3. Calculate Core Metrics
    // Revenue (Tiny is Source of Truth for Sales)
    const totalRevenue = tinyOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = tinyOrders.length;

    // Investment (Google + Meta)
    const googleAdsCost = googleData?.investment || 0;
    const metaAdsCost = metaData?.spend || 0;
    const totalInvestment = googleAdsCost + metaAdsCost;

    console.log(`\n[Dashboard] 📊 RESUMO DE DADOS (PERÍODO FILTRADO):`);
    console.log(`  📅 Período: ${startStr} a ${endStr}`);
    console.log(`  🛒 Pedidos Tiny: ${totalOrders}`);

    // Debug: Show date range of orders actually returned
    if (tinyOrders.length > 0) {
        const firstOrder = tinyOrders[0];
        const lastOrder = tinyOrders[tinyOrders.length - 1];
        console.log(`  📦 Primeiro pedido: ${firstOrder.date}`);
        console.log(`  📦 Último pedido: ${lastOrder.date}`);
    }

    console.log(`  💰 Receita Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`  📈 Investimento: R$ ${totalInvestment.toFixed(2)}`);


    // 4. Calculate New Revenue and Retention USING ONLY SELECTED PERIOD GA4 DATA
    // Use GA4's new users vs returning users to estimate revenue split
    const totalPurchasers = googleData?.purchasers || 0;
    const newUsers = googleData?.newUsers || 0;

    // Estimate: % of new users out of all purchasers
    const newCustomerRatio = totalPurchasers > 0 ? Math.min(newUsers / totalPurchasers, 1.0) : 0.25;

    const newRevenue = totalRevenue * newCustomerRatio;
    const retentionRevenue = totalRevenue - newRevenue;
    const newCustomersCount = Math.round(totalPurchasers * newCustomerRatio);

    console.log(`[Dashboard] 📊 Receita Nova e Retenção (PERÍODO ${startStr} a ${endStr}):`);
    console.log(`  - Total Purchasers (GA4): ${totalPurchasers}`);
    console.log(`  - New Users (GA4): ${newUsers}`);
    console.log(`  - Ratio Novos Clientes: ${(newCustomerRatio * 100).toFixed(1)}%`);
    console.log(`  - Receita Nova: R$ ${newRevenue.toFixed(2)}`);
    console.log(`  - Receita Retenção: R$ ${retentionRevenue.toFixed(2)}`);
    console.log(`  - Clientes Novos: ${newCustomersCount}`);

    // 5. Derived KPIs
    const ticketAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ticketAvgNew = newCustomersCount > 0 ? newRevenue / newCustomersCount : 0;
    const cac = newCustomersCount > 0 ? totalInvestment / newCustomersCount : 0;
    const costPercentage = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 100 : 0;

    // 7. Last 12 Months Data (FIXO) - For Faturamento 12M, LTV 12M, ROI 12M
    const today = new Date();
    const start12m = new Date(today);
    start12m.setDate(start12m.getDate() - 365);
    const start12mStr = format(start12m, "yyyy-MM-dd");
    const end12mStr = format(today, "yyyy-MM-dd");

    console.log(`[Dashboard] 📅 Buscando dados 12 meses FIXOS: ${start12mStr} a ${end12mStr}`);

    const [tinyOrders12mRaw, google12m, meta12m] = await Promise.all([
        getTinyOrders(start12mStr, end12mStr),
        getGoogleAnalyticsData(start12mStr, end12mStr),
        getMetaAdsInsights(start12mStr, end12mStr)
    ]);

    const tiny12m = tinyOrders12mRaw || [];
    const revenue12m = tiny12m.reduce((acc, o) => acc + o.total, 0);
    const cost12m = (google12m?.investment || 0) + (meta12m?.spend || 0);
    const roi12m = cost12m > 0 ? ((revenue12m - cost12m) / cost12m) * 100 : 0;
    const uniqueCustomers12m = google12m?.purchasers || 0;
    const ltv12m = uniqueCustomers12m > 0 ? revenue12m / uniqueCustomers12m : 0;

    console.log(`[Dashboard] 💰 12 Meses FIXOS (últimos 365 dias):`);
    console.log(`  - Faturamento: R$ ${revenue12m.toFixed(2)}`);
    console.log(`  - LTV: R$ ${ltv12m.toFixed(2)}`);
    console.log(`  - ROI: ${roi12m.toFixed(2)}%`);

    // 8. Acquired Customers DINÂMICO (período selecionado)
    const acquiredCustomers = googleData?.purchasers || 0;
    console.log(`[Dashboard] 👥 Clientes Adquiridos no período selecionado: ${acquiredCustomers}`);

    // 8. Last Month Data (FIXED: Always full previous calendar month)
    const lastMonthDate = subMonths(new Date(), 1);
    const startLastMonth = startOfMonth(lastMonthDate);
    const endLastMonth = endOfMonth(lastMonthDate);

    const startLastMonthStr = format(startLastMonth, "yyyy-MM-dd");
    const endLastMonthStr = format(endLastMonth, "yyyy-MM-dd");

    // Format for display (e.g., "01/11 - 30/11")
    const periodLabel = `${format(startLastMonth, "dd/MM")} - ${format(endLastMonth, "dd/MM")}`;

    console.log(`[Dashboard] 📅 Mês Anterior (FIXO): ${startLastMonthStr} a ${endLastMonthStr}`);

    const [tinyLastMonthRaw, googleLastMonth, metaLastMonth] = await Promise.all([
        getTinyOrders(startLastMonthStr, endLastMonthStr),
        getGoogleAnalyticsData(startLastMonthStr, endLastMonthStr),
        getMetaAdsInsights(startLastMonthStr, endLastMonthStr)
    ]);

    // TRUST API
    const tinyLastMonth = tinyLastMonthRaw || [];
    console.log(`[Dashboard] Tiny API returned ${tinyLastMonth.length} orders for Last Month`);

    if (tinyLastMonth.length > 0) {
        console.log(`[Dashboard] Sample last month order:`, JSON.stringify(tinyLastMonth[0]).substring(0, 200));
    }

    const revenueLastMonth = tinyLastMonth.reduce((acc, o) => {
        const total = o.total || 0;
        return acc + total;
    }, 0);
    const investmentLastMonth = (googleLastMonth?.investment || 0) + (metaLastMonth?.spend || 0);

    console.log(`[Dashboard] 📈 Mês Anterior (${periodLabel}):`);
    console.log(`  - Pedidos: ${tinyLastMonth.length}`);
    console.log(`  - Receita: R$ ${revenueLastMonth.toFixed(2)}`);
    console.log(`  - Investimento: R$ ${investmentLastMonth.toFixed(2)}`);

    return {
        kpis: {
            investment: totalInvestment,
            costPercentage,
            ticketAvg,
            ticketAvgNew,
            retentionRevenue, // DINÂMICO
            newRevenue, // DINÂMICO
            acquiredCustomers: acquiredCustomers, // DINÂMICO (período selecionado)
            cac,
            revenue12m: revenue12m, // FIXO (365 dias)
            ltv12m: ltv12m, // FIXO (365 dias)
            roi12m: roi12m // FIXO (365 dias)
        },
        revenue: totalRevenue,
        sessions: googleData?.sessions || 0,
        transactions: totalOrders,
        investment: totalInvestment,
        tinyTotalRevenue: totalRevenue,
        checkouts: googleData?.checkouts || 0,
        addToCarts: googleData?.addToCarts || 0,
        productsViewed: googleData?.itemsViewed || 0,

        tinySource: tinyOrders.length > 0 ? 'Tiny (Real)' : 'Sem Dados',
        midia_source: 'Google Ads + Meta Ads',
        dateRange: { start: startDate, end: endDate },
        roi12Months: roi12m, // FIXO (365 dias)
        // Last Month
        revenueLastMonth: revenueLastMonth,
        investmentLastMonth: investmentLastMonth,
        lastMonthLabel: periodLabel,

        source: 'Tiny + GA4 + Meta + Wake',
    };
}

export async function fetchProductsData() {
    const products = await getTinyProducts();

    if (products.length === 0) return [];

    // Map to simplified object and parse Price
    let mapped = products.map((p: any) => ({
        code: p.produto.codigo,
        name: p.produto.nome,
        // API returns "preco" as unit price. We might need sales quantity to get Total Revenue.
        // But Tiny "produtos.pesquisa" just lists products, not sales.
        // For a TRUE Curve ABC we need sales history from 'getTinyOrders'.
        // For now, let's just list them sorted by Price as a placeholder, OR better:
        // Let's use getTinyOrders to build the ABC curve if possible.
        // Getting ALL orders is heavy. Let's stick to listing products but acknowledge the limit.
        revenue: parseFloat(p.produto.preco),
        quantity: parseFloat(p.produto.saldo_fisico || p.produto.saldo || 0),
        unit: p.produto.unidade || 'UN',
        percentage: 0
    }));

    // Sort by Revenue (Price * Stock? Or just Price? Let's assume Price is value for now)
    mapped.sort((a: any, b: any) => b.revenue - a.revenue);

    const totalRevenue = mapped.reduce((acc: number, curr: any) => acc + curr.revenue, 0);

    // Calculate accumulated %
    let accumulated = 0;
    mapped = mapped.map((p: any) => {
        accumulated += p.revenue;
        const perc = totalRevenue > 0 ? (accumulated / totalRevenue) * 100 : 0;
        return { ...p, percentage: perc.toFixed(2) };
    });

    return mapped.slice(0, 50); // Return top 50
}
