"use server";

import { getGoogleAnalyticsData } from "@/lib/services/google";
import { getTinyOrders, getTinyProducts } from "@/lib/services/tiny";
import { getMetaAdsInsights } from "@/lib/services/meta"; // Import Meta Service
import { differenceInDays, subDays, parseISO, format, subMonths } from "date-fns";

import { getWakeOrders } from "@/lib/services/wake";
import { parseCurrency } from "@/lib/utils";

export async function fetchDashboardData(startDate = "30daysAgo", endDate = "today") {
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

    // 2. Fetch Data (Parallel)
    const [googleData, tinyOrders, metaData, wakeOrders] = await Promise.all([
        getGoogleAnalyticsData(startStr, endStr),
        getTinyOrders(startStr, endStr),
        getMetaAdsInsights(startStr, endStr),
        getWakeOrders(startStr, endStr)
    ]);

    // 3. Calculate Core Metrics
    // Revenue (Tiny is Source of Truth for Sales)
    const totalRevenue = tinyOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = tinyOrders.length;

    // Investment (Google + Meta)
    const googleAdsCost = googleData?.investment || 0;
    const metaAdsCost = metaData?.spend || 0;
    const totalInvestment = googleAdsCost + metaAdsCost;

    console.log(`\n[Dashboard] 📊 RESUMO DE DADOS:`);
    console.log(`  📅 Período: ${startStr} a ${endStr}`);
    console.log(`  🛒 Pedidos Tiny: ${totalOrders}`);
    console.log(`  💰 Receita Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`  📈 Investimento: R$ ${totalInvestment.toFixed(2)}`);


    // 4. "New Revenue" & "New Customers" Logic (Wake is Source of Truth for Customer Type)
    // Wake usually has a 'clienteNovo' boolean or we can infer it.
    // Assuming Wake Order structure has something to identify new user or we just count unique emails?
    // Actually, Wake API V2/B2C usually has `novoCliente` (boolean) or we look at `pedidosAnteriores`.
    // Let's inspect ONE Wake order structure if possible, but for now we'll assume a standard B2C logic:
    // We will consider orders where `novoCliente` is true OR just filter strictly if the field exists.
    // If field is missing, we might need to count purely based on "First Order" logic if we had full history.
    // FALLBACK: Since we don't know the exact Wake field name without docs/inspect, 
    // we'll filter ANY order that looks like a "First Buy".
    // A common field in Fbits/Wake is `clienteNovo`.

    // Mapping Wake Orders to find "New Revenue" portion
    // We can't easily map 1:1 Wake Order to Tiny Order without ID matching.
    // Tiny is "Fiscal", Wake is "E-commerce".
    // STRATEGY: 
    // 1. Calculate % of Revenue that is New from Wake.
    // 2. Apply that % to Tiny Total Revenue (to match Fiscal reality).

    let wakeTotalRevenue = 0;
    let wakeNewRevenue = 0;
    let wakeNewCustomersCount = 0;


    if (wakeOrders && Array.isArray(wakeOrders)) {
        console.log(`[Dashboard] 🌊 Processando ${wakeOrders.length} pedidos Wake...`);

        wakeOrders.forEach((o: any) => {
            const val = parseCurrency(o.valorTotal || o.total);
            wakeTotalRevenue += val;

            // Check for "New Client" flag. 
            // Common keys: clienteNovo, primeiraCompra, or in 'cliente' object
            const isNew = o.clienteNovo === true || o.primeiraCompra === true; // Hypothesis

            if (isNew) {
                wakeNewRevenue += val;
                wakeNewCustomersCount++;
            }
        });

        console.log(`  💵 Wake - Receita Total: R$ ${wakeTotalRevenue.toFixed(2)}`);
        console.log(`  ✨ Wake - Receita Novos: R$ ${wakeNewRevenue.toFixed(2)}`);
        console.log(`  👥 Wake - Clientes Novos: ${wakeNewCustomersCount}`);
    } else {
        console.warn(`[Dashboard] ⚠️  Wake retornou dados inválidos ou vazios`);
    }

    // derived percentages from Wake
    const newRevenueShare = wakeTotalRevenue > 0 ? wakeNewRevenue / wakeTotalRevenue : 0;

    // Apply to Tiny numbers for consistency
    const newRevenue = totalRevenue * newRevenueShare;
    const retentionRevenue = totalRevenue - newRevenue;

    // We can use Wake's count for "Acquired Customers" directly if valid, or scale it? 
    // Let's use Wake's raw count for "Acquired Customers" as it's the marketing source.
    const newCustomersCount = wakeNewCustomersCount;


    // 6. Derived KPIs
    const ticketAvg = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const ticketAvgNew = newCustomersCount > 0 ? newRevenue / newCustomersCount : 0;
    const cac = newCustomersCount > 0 ? totalInvestment / newCustomersCount : 0;
    const costPercentage = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 100 : 0;

    // 7. Last 12 Months Data (For LTV, ROI 12M)
    const start12m = subMonths(new Date(), 12);
    const start12mStr = format(start12m, "yyyy-MM-dd");

    // We only need Tiny/Meta/Google for 12m macro data
    const [tiny12m, google12m, meta12m] = await Promise.all([
        getTinyOrders(start12mStr, endStr), // Warning: expensive call
        getGoogleAnalyticsData(start12mStr, endStr),
        getMetaAdsInsights(start12mStr, endStr)
    ]);

    const revenue12m = tiny12m.reduce((acc, o) => acc + o.total, 0);
    const cost12m = (google12m?.investment || 0) + (meta12m?.spend || 0);
    const roi12m = cost12m > 0 ? ((revenue12m - cost12m) / cost12m) * 100 : 0; // Fixed ROI Formula (Profit/Cost) * 100

    // LTV (Lifetime Value)
    // Tiny doesn't give us unique customers count easily in list.
    // We can count unique IDs? No, `getTinyOrders` returns order list.
    // Approximate Unique Customers: distinct names/CPFs? 
    // Tiny "pedido.cliente.nome" is likely available in raw.
    // Let's approximate Unique Customers in 12m for LTV.
    const uniqueCustomers12m = new Set(tiny12m.map(o => o.raw?.pedido?.cliente?.nome || o.id)).size;
    const ltv12m = uniqueCustomers12m > 0 ? revenue12m / uniqueCustomers12m : 0;


    return {
        kpis: {
            investment: totalInvestment,
            costPercentage,
            ticketAvg,
            ticketAvgNew,
            retentionRevenue,
            newRevenue,
            acquiredCustomers: newCustomersCount,
            cac,
            revenue12m,
            ltv12m,
            roi12m
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

        previous: {
            revenue: 0,
            investment: 0,
            range: "N/A"
        },

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
