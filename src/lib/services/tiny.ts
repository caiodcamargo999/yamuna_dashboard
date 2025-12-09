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

    if (TINY_TOKEN.trim() === '') {
        console.error("[Tiny API] ❌ ERRO: TINY_API_TOKEN está vazia!");
        return [];
    }

    console.log(`[Tiny API] ✓ Token configurado: ${TINY_TOKEN.substring(0, 15)}...`);
    console.log(`[Tiny API] 📅 Buscando pedidos de ${startDate} até ${endDate}`);
    console.log(`[Tiny API] 🔍 Iniciando busca paginada...`);

    const searchStart = Date.now();

    let allOrders: TinyOrder[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 20; // Safety limit to prevent infinite loops

    while (hasMore && page <= maxPages) {
        // Removed situacao=aprovado to fetch ALL orders (Olist dashboard shows 200+, we only got 22 approved)
        let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&pagina=${page}`;

        if (startDate) url += `&data_inicial=${formatDate(startDate)}`;
        if (endDate) url += `&data_final=${formatDate(endDate)}`;

        // Debug URL
        console.log(`[Tiny Fetch] Page ${page} | URL: ${url}`);

        try {
            const res = await fetch(url, {
                next: { revalidate: 0 },  // Disable cache for debugging
                cache: 'no-store'
            });
            const data = await res.json();

            // Log response status
            console.log(`[Tiny Response] Status: ${data.retorno?.status} | Key 'pedidos' exists: ${!!data.retorno?.pedidos}`);

            if (data.retorno.status === "Erro") {
                // Check if it's just "empty"
                if (data.retorno.erros && data.retorno.erros[0]?.erro?.includes("A pesquisa nao retornou registros")) {
                    console.log("[Tiny Info] No more records found.");
                } else {
                    console.error("[Tiny Error]", JSON.stringify(data.retorno.erros));
                }
                hasMore = false;
                break;
            }

            const orders: TinyOrder[] = data.retorno.pedidos || [];
            console.log(`[Tiny Page ${page}] 📦 Encontrados ${orders.length} pedidos`);

            if (orders.length > 0 && page === 1) {
                console.log(`[Tiny Sample] Estrutura do primeiro pedido:`, JSON.stringify(orders[0], null, 2));
            }

            if (orders.length === 0) {
                hasMore = false;
            } else {
                allOrders = [...allOrders, ...orders];
                page++;
            }
        } catch (error) {
            console.error("Error fetching Tiny data:", error);
            hasMore = false;
        }
    }

    // Filter out cancelled orders
    const validOrders = allOrders.filter(o => o.pedido?.situacao !== 'cancelado');

    const searchTime = Date.now() - searchStart;
    console.log(`[Tiny API] ⏱️  Busca concluída em ${searchTime}ms`);
    console.log(`[Tiny API] 📊 Total de pedidos brutos: ${allOrders.length}`);
    console.log(`[Tiny API] ✅ Pedidos válidos (não cancelados): ${validOrders.length}`);

    if (validOrders.length > 0) {
        const first = validOrders[0].pedido;
        const parsedValue = parseCurrency(first.valor_total);
        console.log(`[Tiny Debug] 💰 Primeiro pedido:`);
        console.log(`  - ID: ${first.id}`);
        console.log(`  - Data: ${first.data_pedido}`);
        console.log(`  - Valor RAW: "${first.valor_total}" (type: ${typeof first.valor_total})`);
        console.log(`  - Valor PARSED: R$ ${parsedValue.toFixed(2)}`);
        console.log(`  - Situação: ${first.situacao}`);

        // Calculate total revenue for verification
        const totalRevenue = validOrders.reduce((sum, o) => sum + parseCurrency(o.pedido?.valor_total), 0);
        console.log(`[Tiny Debug] 💵 Receita total calculada: R$ ${totalRevenue.toFixed(2)}`);
    } else {
        console.warn(`[Tiny API] ⚠️  ATENÇÃO: Nenhum pedido válido encontrado para o período ${startDate} a ${endDate}`);
    }

    return validOrders.map((o: any) => ({
        id: o.pedido?.id || "N/A",
        date: o.pedido?.data_pedido || "",
        total: parseCurrency(o.pedido?.valor_total),
        status: o.pedido?.situacao || "",
        raw: { ...o, debug_total: o.pedido?.valor_total }
    }));
}

export async function getTinyProducts() {
    if (!TINY_TOKEN) return [];

    const url = `https://api.tiny.com.br/api2/produtos.pesquisa.php?token=${TINY_TOKEN}&formato=json`;

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1hr
        const data = await res.json();
        if (data.retorno.status === "Erro") return [];

        const products = data.retorno.produtos || [];
        if (products.length > 0) {
            console.log("[Tiny] Sample Product:", JSON.stringify(products[0], null, 2));
        }

        return products;
    } catch (e) {
        console.error(e);
        return [];
    }
}
