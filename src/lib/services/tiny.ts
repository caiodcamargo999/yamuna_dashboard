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

export async function getTinyOrders(startDate?: string, endDate?: string) {
    if (!TINY_TOKEN) {
        console.warn("Missing Tiny API Token");
        return [];
    }

<<<<<<< HEAD
    let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&situacao=aprovado`;

    if (startDate) url += `&data_inicial=${formatDate(startDate)}`;
    if (endDate) url += `&data_final=${formatDate(endDate)}`;

    try {
        const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5min
        const data = await res.json();

        if (data.retorno.status === "Erro") {
            return [];
        }

        const orders: TinyOrder[] = data.retorno.pedidos || [];

        if (orders.length > 0) {
            console.log("[Tiny Debug] First Order Structure:", JSON.stringify(orders[0], null, 2));
        }

        return orders.map((o: any) => ({
            id: o.pedido?.id || "N/A",
            date: o.pedido?.data_pedido || "",
            total: o.pedido?.valor_total ?
                parseFloat(o.pedido.valor_total.replace(/\./g, '').replace(',', '.')) : 0,
            status: o.pedido?.situacao || "",
            raw: { ...o, debug_total: o.pedido?.valor_total } // Log raw total to debug
        }));

    } catch (error) {
        console.error("Error fetching Tiny data:", error);
        return [];
    }
=======
    let allOrders: TinyOrder[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 20; // Safety limit to prevent infinite loops

    while (hasMore && page <= maxPages) {
        // Removed situacao=aprovado to fetch ALL orders (Olist dashboard shows 200+, we only got 22 approved)
        let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&pagina=${page}`;

        if (startDate) url += `&data_inicial=${formatDate(startDate)}`;
        if (endDate) url += `&data_final=${formatDate(endDate)}`;

        try {
            const res = await fetch(url, { next: { revalidate: 300 } });
            const data = await res.json();

            if (data.retorno.status === "Erro") {
                // If error is "No records found" (usual for last page + 1), stop.
                hasMore = false;
                break;
            }

            const orders: TinyOrder[] = data.retorno.pedidos || [];
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

    return validOrders.map((o: any) => ({
        id: o.pedido?.id || "N/A",
        date: o.pedido?.data_pedido || "",
        total: o.pedido?.valor_total ?
            parseFloat(o.pedido.valor_total.replace(/\./g, '').replace(',', '.')) : 0,
        status: o.pedido?.situacao || "",
        raw: { ...o, debug_total: o.pedido?.valor_total }
    }));
>>>>>>> production-release
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
