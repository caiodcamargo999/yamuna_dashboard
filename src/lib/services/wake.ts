const WAKE_API_URL = process.env.WAKE_API_URL;
const WAKE_API_TOKEN = process.env.WAKE_API_TOKEN;

// Helper to format date dd/mm/yyyy - Wake might use a different format, verifying docs usually YYYY-MM-DD for filters
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export async function getWakeProducts() {
    if (!WAKE_API_URL || !WAKE_API_TOKEN) {
        return { error: "Missing Wake Credentials" };
    }

    // URL Candidates:
    // Standard Fbits: https://api.fbits.net/produtos
    const url = `${WAKE_API_URL}/produtos`;

    try {
        const res = await fetch(url, {
            headers: {
                // 'Authorization': `Bearer ${WAKE_API_TOKEN}`, // Gave 401
                'Authorization': `Basic ${WAKE_API_TOKEN}`, // Trying Basic Auth for Fbits/Wake
                'Accept': 'application/json'
            },
            next: { revalidate: 0 } // Disable cache for debugging
        });

        if (!res.ok) {
            const text = await res.text();
            // If text is HTML, just show the title or first 100 chars
            const cleanText = text.includes("<!DOCTYPE") ? `HTML Response: ${text.substring(0, 100)}...` : text;
            return { error: `API Error ${res.status} at ${url}: ${cleanText}` };
        }

        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            const cleanText = text.includes("<!DOCTYPE") ? `HTML Response: ${text.substring(0, 100)}...` : text.substring(0, 200);
            return { error: `Invalid JSON at ${url}: ${cleanText}` };
        }

    } catch (error: any) {
        return { error: `Fetch Failed to ${url}: ${error.message}` };
    }
}

export async function getWakeOrders(startDate: string, endDate: string) {
    if (!WAKE_API_URL || !WAKE_API_TOKEN) {
        console.error("[Wake API] ❌ ERRO: Credenciais Wake não configuradas!");
        console.error(`  - WAKE_API_URL: ${WAKE_API_URL ? 'Configurada' : 'FALTANDO'}`);
        console.error(`  - WAKE_API_TOKEN: ${WAKE_API_TOKEN ? 'Configurada' : 'FALTANDO'}`);
        return [];
    }

    console.log(`[Wake API] ✓ Credenciais configuradas`);
    console.log(`[Wake API] 📅 Buscando pedidos de ${startDate} até ${endDate}`);

    const searchStart = Date.now();

    const url = `${WAKE_API_URL}/pedidos?dataInicial=${startDate}&dataFinal=${endDate}`;
    console.log(`[Wake Fetch] URL: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Basic ${WAKE_API_TOKEN}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 0 },  // Disable cache for debugging
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`[Wake API] ❌ Erro HTTP ${res.status}`);
            const errorText = await res.text();
            console.error(`[Wake API] Response: ${errorText.substring(0, 200)}`);
            return [];
        }

        const data = await res.json();

        // Return raw list, we will filter in actions.ts
        const orders = Array.isArray(data) ? data : (data.lista || []);

        const searchTime = Date.now() - searchStart;
        console.log(`[Wake API] ⏱️  Busca concluída em ${searchTime}ms`);
        console.log(`[Wake API] 📦 Total de pedidos: ${orders.length}`);

        if (orders.length > 0) {
            console.log(`[Wake Sample] Estrutura do primeiro pedido:`, JSON.stringify(orders[0], null, 2));

            // Check what fields exist for revenue
            const firstOrder = orders[0];
            console.log(`[Wake Debug] Campos disponíveis:`, Object.keys(firstOrder));
            console.log(`[Wake Debug] valorTotal: ${firstOrder.valorTotal}`);
            console.log(`[Wake Debug] total: ${firstOrder.total}`);
        } else {
            console.warn(`[Wake API] ⚠️  ATENÇÃO: Nenhum pedido encontrado para ${startDate} a ${endDate}`);
        }

        return orders;

    } catch (error: any) {
        console.error("[Wake API] ❌ Erro na requisição:", error.message);
        return [];
    }
}
