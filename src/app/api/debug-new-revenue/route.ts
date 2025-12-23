import { NextResponse } from 'next/server';
import { getTinyOrdersWithCustomers } from '@/lib/services/tiny';
import { getWakeOrders } from '@/lib/services/wake';
import { mergeOrders, getCustomerId, calculateRevenueSegmentation } from '@/lib/services/customers';
import { format, subDays } from 'date-fns';

/**
 * Debug endpoint to verify New Revenue calculation
 * Usage: /api/debug-new-revenue?days=30
 * 
 * This endpoint helps audit the "Receita Nova" calculation by showing:
 * - Total orders and revenue
 * - New vs returning customer breakdown
 * - Sample customers from each category
 * - Customer identification quality metrics
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const historicalStartDate = subDays(startDate, 180); // 6 months before

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const historicalStartStr = format(historicalStartDate, 'yyyy-MM-dd');
    const historicalEndStr = format(subDays(startDate, 1), 'yyyy-MM-dd');

    console.log(`[Debug New Revenue] Period: ${startStr} to ${endStr}`);
    console.log(`[Debug New Revenue] Historical: ${historicalStartStr} to ${historicalEndStr}`);

    try {
        // Fetch current period orders with FULL customer data (CPF/CNPJ)
        const [tinyOrders, wakeOrders] = await Promise.all([
            getTinyOrdersWithCustomers(startStr, endStr),
            getWakeOrders(startStr, endStr)
        ]);

        const currentOrders = mergeOrders(tinyOrders || [], wakeOrders || []);

        if (currentOrders.length === 0) {
            return NextResponse.json({
                error: 'Nenhum pedido encontrado no período atual',
                periods: {
                    current: { start: startStr, end: endStr },
                    historical: { start: historicalStartStr, end: historicalEndStr }
                }
            });
        }

        // Fetch historical orders with FULL customer data (CPF/CNPJ)
        const [historicalTiny, historicalWake] = await Promise.all([
            getTinyOrdersWithCustomers(historicalStartStr, historicalEndStr),
            getWakeOrders(historicalStartStr, historicalEndStr)
        ]);

        const historicalOrders = mergeOrders(historicalTiny || [], historicalWake || []);

        console.log(`[Debug New Revenue] Current orders: ${currentOrders.length}`);
        console.log(`[Debug New Revenue] Historical orders: ${historicalOrders.length}`);

        // Calculate segmentation
        const segmentation = calculateRevenueSegmentation(currentOrders, historicalOrders);

        // Analyze customer identification quality
        let cpfCnpjCount = 0;
        let emailCount = 0;
        let nameCount = 0;
        let unknownCount = 0;

        currentOrders.forEach(order => {
            const customerId = getCustomerId(order);
            if (customerId.startsWith('cpf_')) cpfCnpjCount++;
            else if (customerId.includes('@')) emailCount++;
            else if (customerId.startsWith('name_')) nameCount++;
            else unknownCount++;
        });

        const totalOrders = currentOrders.length;
        const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Get samples of new customers
        const newCustomerIds = new Set<string>();
        const returningCustomerIds = new Set<string>();
        const historicalCustomerIds = new Set<string>();

        historicalOrders.forEach(order => {
            const id = getCustomerId(order);
            historicalCustomerIds.add(id);
        });

        const newCustomerOrders: any[] = [];
        const returningCustomerOrders: any[] = [];

        currentOrders.forEach(order => {
            const customerId = getCustomerId(order);
            if (historicalCustomerIds.has(customerId)) {
                returningCustomerIds.add(customerId);
                if (returningCustomerOrders.length < 10) {
                    returningCustomerOrders.push({
                        pedidoId: order.id,
                        customerName: order.customerName || order.nome || 'N/A',
                        customerId: customerId.startsWith('cpf_')
                            ? customerId.substring(0, 10) + '***'
                            : customerId,
                        total: order.total,
                        date: order.date
                    });
                }
            } else {
                newCustomerIds.add(customerId);
                if (newCustomerOrders.length < 10) {
                    newCustomerOrders.push({
                        pedidoId: order.id,
                        customerName: order.customerName || order.nome || 'N/A',
                        customerId: customerId.startsWith('cpf_')
                            ? customerId.substring(0, 10) + '***'
                            : customerId,
                        total: order.total,
                        date: order.date
                    });
                }
            }
        });

        const cpfCnpjRate = (cpfCnpjCount / totalOrders) * 100;

        return NextResponse.json({
            summary: {
                period: { start: startStr, end: endStr, days },
                historical: { start: historicalStartStr, end: historicalEndStr },
                totalOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                newRevenue: parseFloat(segmentation.newRevenue.toFixed(2)),
                retentionRevenue: parseFloat(segmentation.retentionRevenue.toFixed(2)),
                newCustomersCount: segmentation.newCustomersCount,
                returningCustomersCount: segmentation.returningCustomersCount,
                revenueCheck: {
                    isValid: Math.abs((segmentation.newRevenue + segmentation.retentionRevenue) - totalRevenue) < 0.01,
                    difference: Math.abs((segmentation.newRevenue + segmentation.retentionRevenue) - totalRevenue)
                }
            },
            identificationQuality: {
                cpfCnpj: {
                    count: cpfCnpjCount,
                    percentage: parseFloat(cpfCnpjRate.toFixed(2)),
                    status: cpfCnpjRate >= 80 ? '✅ Excelente' : cpfCnpjRate >= 50 ? '⚠️ Aceitável' : '🚨 Baixo'
                },
                email: {
                    count: emailCount,
                    percentage: parseFloat(((emailCount / totalOrders) * 100).toFixed(2))
                },
                name: {
                    count: nameCount,
                    percentage: parseFloat(((nameCount / totalOrders) * 100).toFixed(2))
                },
                unknown: {
                    count: unknownCount,
                    percentage: parseFloat(((unknownCount / totalOrders) * 100).toFixed(2))
                }
            },
            recommendation: cpfCnpjRate >= 80
                ? '✅ Taxa de CPF/CNPJ excelente! A Receita Nova está sendo calculada com alta precisão.'
                : cpfCnpjRate >= 50
                    ? '⚠️ Taxa de CPF/CNPJ aceitável, mas pode melhorar. Considere enriquecer dados com getTinyOrdersWithCustomers().'
                    : '🚨 Taxa de CPF/CNPJ baixa! RECOMENDA-SE usar getTinyOrdersWithCustomers() para buscar detalhes completos.',
            samples: {
                newCustomers: newCustomerOrders,
                returningCustomers: returningCustomerOrders
            },
            instructions: {
                howToVerify: [
                    '1. Pegue alguns nomes da lista "newCustomers"',
                    '2. Busque esses clientes no Tiny ERP',
                    '3. Verifique se realmente são clientes de primeira compra no período',
                    '4. Repita para "returningCustomers" - devem ter compras anteriores'
                ],
                expectedResults: {
                    newRevenuePlusRetention: 'Deve ser igual ao totalRevenue',
                    cpfCnpjRate: 'Deve ser > 80% para precisão máxima'
                }
            }
        });

    } catch (error: any) {
        console.error('[Debug New Revenue] Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
