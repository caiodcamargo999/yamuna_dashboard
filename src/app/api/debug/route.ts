import { NextResponse } from 'next/server';
import { getTinyOrders } from '@/lib/services/tiny';
import { getWakeOrders } from '@/lib/services/wake';
import { getGoogleAnalyticsData } from '@/lib/services/google';
import { getMetaAdsInsights } from '@/lib/services/meta';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') || '2025-01-01';
    const end = searchParams.get('end') || '2025-12-31';

    console.log(`[Debug API] 🔍 Testando APIs com range: ${start} a ${end}`);

    try {
        const [tinyOrders, wakeOrders, googleData, metaData] = await Promise.all([
            getTinyOrders(start, end),
            getWakeOrders(start, end),
            getGoogleAnalyticsData(start, end),
            getMetaAdsInsights(start, end)
        ]);

        const tinyRevenue = tinyOrders.reduce((sum, o) => sum + o.total, 0);

        return NextResponse.json({
            success: true,
            dateRange: { start, end },
            tiny: {
                configured: !!process.env.TINY_API_TOKEN,
                count: tinyOrders.length,
                totalRevenue: tinyRevenue,
                sample: tinyOrders[0] || null,
                allOrders: tinyOrders.slice(0, 3).map(o => ({
                    id: o.id,
                    date: o.date,
                    total: o.total,
                    status: o.status
                }))
            },
            wake: {
                configured: !!(process.env.WAKE_API_URL && process.env.WAKE_API_TOKEN),
                count: wakeOrders.length,
                sample: wakeOrders[0] || null
            },
            google: {
                sessions: googleData?.sessions || 0,
                investment: googleData?.investment || 0
            },
            meta: {
                spend: metaData?.spend || 0
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('[Debug API] ❌ Erro:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
