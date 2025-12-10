const TINY_TOKEN = process.env.TINY_API_TOKEN;

interface TinyOrder {
    pedido: {
        id: string;
        numero: string;
        data_pedido: string;
        valor_total: string;
        situacao: string;
    };
}

// Helper to format date dd/mm/yyyy
function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// Helper to parse currency safely (Handle 1.000,00 vs 1000.00 vs 1000)
function parseCurrency(value: string | number | undefined): number {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === 'number') return value;

    // Check if it's Brazilian format (has comma, and maybe dots before it)
    if (value.includes(',')) {
        // remove dots (thousands separator), replace comma with dot (decimal)
        const normalized = value.replace(/\./g, '').replace(',', '.');
        return parseFloat(normalized);
    }

    // Standard number string
    return parseFloat(value);
}

export async function getTinyOrders(startDate?: string, endDate?: string) {
    if (!TINY_TOKEN) {
        console.error("[Tiny API] ❌ ERRO: TINY_API_TOKEN não configurada!");
        return [];
    }

    console.log(`[Tiny API] ✓ Token configurado`);
    console.log(`[Tiny API] 📅 Buscando pedidos de ${startDate} até ${endDate}`);

    let allOrders: TinyOrder[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 5; // 5 pages * 100 = 500 orders (~3-4 months, ~1.5s load time)

    while (hasMore && page <= maxPages) {
        let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&pagina=${page}`;

        // Convert yyyy-MM-dd to dd/MM/yyyy format that Tiny expects
        if (startDate) {
            const [y, m, d] = startDate.split('-');
            const tinyFormat = `${d}/${m}/${y}`;
            url += `&dataInicio=${tinyFormat}&data_inicial=${tinyFormat}`;
            console.log(`[Tiny API] 📅 Data Início=${tinyFormat}`);
        }
        if (endDate) {
            const [y, m, d] = endDate.split('-');
            const tinyFormat = `${d}/${m}/${y}`;
            url += `&dataFim=${tinyFormat}&data_final=${tinyFormat}`;
            console.log(`[Tiny API] 📅 Data Fim=${tinyFormat}`);
        }

        try {
            console.log(`[Tiny API] 🔍 Fetching page ${page}... URL: ${url}`);
            const res = await fetch(url, {
                next: { revalidate: 0 },
                cache: 'no-store'
            });

            if (!res.ok) {
                console.error(`[Tiny API] ❌ HTTP Error: ${res.status}`);
                break;
            }

            const data = await res.json();

            // Log response structure to debug
            // console.log(`[Tiny API] Response keys:`, Object.keys(data));

            if (data.retorno?.status_processamento === 3 || !data.retorno?.pedidos) {
                // Status 3 = No records found or end of list
                // console.log(`[Tiny API] ℹ️ End of data at page ${page}`);
                hasMore = false;
            } else {
                const orders = data.retorno.pedidos;
                allOrders = [...allOrders, ...orders];
                console.log(`[Tiny API] ✅ Page ${page} received ${orders.length} orders. Total so far: ${allOrders.length}`);

                // If page full (usually 100), maybe more pages
                if (orders.length < 100) {
                    hasMore = false;
                } else {
                    page++;
                }
            }
        } catch (error) {
            console.error("Error fetching Tiny:", error);
            hasMore = false;
        }
    }

    const validOrders = allOrders.filter(o => o.pedido?.situacao !== 'cancelado');

    console.log(`[Tiny API] ✅ ${validOrders.length} pedidos válidos`);

    if (validOrders.length > 0) {
        const first = validOrders[0].pedido;
        console.log(`[Tiny Debug] Sample:`, JSON.stringify(first, null, 2).substring(0, 300));
    }

    // Map and extract values - try multiple possible field names
    return validOrders.map((o: any) => {
        const pedido = o.pedido || o;

        // Try all possible value fields
        const rawValue = pedido.valor_total || pedido.valor || pedido.total_pedido || pedido.total || "0";
        const total = parseCurrency(rawValue);

        return {
            id: pedido.id || pedido.numero || "N/A",
            date: pedido.data_pedido || "",
            total: total,
            status: pedido.situacao || "",
            raw: pedido
        };
    });
}

export async function getTinyProducts() {
    if (!TINY_TOKEN) return [];

    const url = `https://api.tiny.com.br/api2/produtos.pesquisa.php?token=${TINY_TOKEN}&formato=json`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 0 },
            cache: 'no-store'
        });
        const data = await res.json();
        if (data.retorno.status === "Erro") return [];

        const products = data.retorno.produtos || [];
        return products;
    } catch (e) {
        console.error(e);
        return [];
    }
}
