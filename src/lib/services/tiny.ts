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
    const maxPages = 10; // Limit for performance

    while (hasMore && page <= maxPages) {
        let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&pagina=${page}`;

        if (startDate) url += `&data_inicial=${formatDate(startDate)}`;
        if (endDate) url += `&data_final=${formatDate(endDate)}`;

        try {
            const res = await fetch(url, {
                next: { revalidate: 0 },
                cache: 'no-store'
            });
            const data = await res.json();

            if (data.retorno.status === "Erro") {
                console.log("[Tiny] No more records");
                hasMore = false;
                break;
            }

            const orders: TinyOrder[] = data.retorno.pedidos || [];
            console.log(`[Tiny Page ${page}] 📦 ${orders.length} pedidos`);

            if (orders.length === 0) {
                hasMore = false;
            } else {
                allOrders = [...allOrders, ...orders];
                page++;
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
