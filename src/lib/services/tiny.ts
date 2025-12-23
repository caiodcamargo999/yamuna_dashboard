const TINY_TOKEN = process.env.TINY_API_TOKEN;

interface TinyOrderBasic {
    pedido: {
        id: string;
        numero: string;
        data_pedido: string;
        valor_total: string;
        situacao: string;
    };
}

export interface TinyOrder {
    id: string;
    date: string;
    total: number;
    status: string;
    customerCpfCnpj: string;
    customerName: string;
    customerEmail: string;
    seller: string;
    raw: any;
}

interface TinyOrderDetail {
    id: string;
    numero: string;
    date: string;
    total: number;
    status: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCpfCnpj?: string; // CPF/CNPJ for accurate customer identification
    raw?: any;
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

// Cache for order details to avoid repeated API calls
const orderDetailsCache = new Map<string, TinyOrderDetail>();

/**
 * Get detailed order info including customer data
 * Uses pedido.obter.php endpoint
 */
async function getTinyOrderDetail(orderId: string): Promise<TinyOrderDetail | null> {
    // Check cache first
    if (orderDetailsCache.has(orderId)) {
        return orderDetailsCache.get(orderId)!;
    }

    if (!TINY_TOKEN) return null;

    try {
        const url = `https://api.tiny.com.br/api2/pedido.obter.php?token=${TINY_TOKEN}&id=${orderId}&formato=json`;
        const res = await fetch(url, {
            next: { revalidate: 0 },
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data = await res.json();

        if (data.retorno?.status === "Erro" || !data.retorno?.pedido) {
            return null;
        }

        const pedido = data.retorno.pedido;
        const cliente = pedido.cliente || {};

        const detail: TinyOrderDetail = {
            id: pedido.id || orderId,
            numero: pedido.numero || "",
            date: pedido.data_pedido || "",
            total: parseCurrency(pedido.total_pedido || pedido.valor || "0"),
            status: pedido.situacao || "",
            customerId: cliente.codigo || cliente.id || cliente.cpf_cnpj || cliente.email || `cliente_${orderId}`,
            customerName: cliente.nome || "Cliente",
            customerEmail: cliente.email || "",
            customerPhone: cliente.fone || "",
            customerCpfCnpj: cliente.cpf_cnpj || cliente.cnpj || "", // Extract CPF/CNPJ
            raw: pedido
        };

        // Cache the result
        orderDetailsCache.set(orderId, detail);
        return detail;

    } catch (error) {
        console.error(`[Tiny API] Error fetching order ${orderId}:`, error);
        return null;
    }
}

/**
 * Get orders with FULL customer data
 * This fetches basic list then enriches with customer details
 * Note: More API calls but accurate data
 */
export async function getTinyOrdersWithCustomers(startDate?: string, endDate?: string): Promise<TinyOrderDetail[]> {
    // First get basic order list
    const basicOrders = await getTinyOrders(startDate, endDate);

    if (basicOrders.length === 0) return [];

    console.log(`[Tiny API] 🔍 Fetching customer details for ${basicOrders.length} orders...`);

    // Limit to avoid API rate limits (Tiny has limits)
    const ordersToEnrich = basicOrders.slice(0, 100); // Max 100 detailed requests

    // Fetch order details in batches of 10 to avoid rate limits
    const batchSize = 10;
    const enrichedOrders: TinyOrderDetail[] = [];

    for (let i = 0; i < ordersToEnrich.length; i += batchSize) {
        const batch = ordersToEnrich.slice(i, i + batchSize);

        const details = await Promise.all(
            batch.map(order => getTinyOrderDetail(order.id))
        );

        details.forEach(detail => {
            if (detail) enrichedOrders.push(detail);
        });

        // Small delay between batches to respect API limits
        if (i + batchSize < ordersToEnrich.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    console.log(`[Tiny API] ✅ Enriched ${enrichedOrders.length} orders with customer data`);

    // Log sample for debugging
    if (enrichedOrders.length > 0) {
        const sample = enrichedOrders[0];
        console.log(`[Tiny Debug] Sample enriched order:`, {
            id: sample.id,
            customerName: sample.customerName,
            customerEmail: sample.customerEmail,
            total: sample.total,
            date: sample.date
        });
    }

    return enrichedOrders;
}

/**
 * Original function - basic orders WITHOUT customer details
 * Faster but limited data
 */
export async function getTinyOrders(startDate?: string, endDate?: string) {
    if (!TINY_TOKEN) {
        console.error("[Tiny API] ❌ ERRO: TINY_API_TOKEN não configurada!");
        return [];
    }

    console.log(`[Tiny API] ✓ Token configurado`);
    console.log(`[Tiny API] 📅 Buscando pedidos de ${startDate} até ${endDate}`);

    let allOrders: TinyOrderBasic[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 50; // Increased to capture Black Friday volume

    // Convert dates to Tiny format (dd/MM/yyyy)
    let tinyStartDate = "";
    let tinyEndDate = "";

    if (startDate) {
        const [y, m, d] = startDate.split('-');
        tinyStartDate = `${d}/${m}/${y}`;
    }
    if (endDate) {
        const [y, m, d] = endDate.split('-');
        tinyEndDate = `${d}/${m}/${y}`;
    }

    while (hasMore && page <= maxPages) {
        // Tiny API uses "dataInicial" and "dataFinal" for date filtering
        let url = `https://api.tiny.com.br/api2/pedidos.pesquisa.php?token=${TINY_TOKEN}&formato=json&pagina=${page}`;

        // Add date parameters (using multiple parameter names for compatibility)
        if (tinyStartDate) {
            url += `&dataInicial=${encodeURIComponent(tinyStartDate)}`;
            console.log(`[Tiny API] 📅 Data Início=${tinyStartDate}`);
        }
        if (tinyEndDate) {
            url += `&dataFinal=${encodeURIComponent(tinyEndDate)}`;
            console.log(`[Tiny API] 📅 Data Fim=${tinyEndDate}`);
        }

        try {
            console.log(`[Tiny API] 🔍 Fetching page ${page}...`);

            let retries = 0;
            const maxRetries = 3;
            let data: any = null;

            while (retries <= maxRetries) {
                const res = await fetch(url, {
                    next: { revalidate: 0 },
                    cache: 'no-store'
                });

                if (!res.ok) {
                    console.error(`[Tiny API] ❌ HTTP Error: ${res.status}`);
                    break;
                }

                data = await res.json();

                // Check for rate limit error
                const isRateLimited = data.retorno?.codigo_erro === 6;

                if (isRateLimited && retries < maxRetries) {
                    const waitTime = Math.pow(2, retries) * 2000; // 2s, 4s, 8s
                    console.log(`[Tiny API] ⏸️  Rate limited, waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    retries++;
                    continue;
                }

                break; // Success or non-rate-limit error
            }

            if (!data) {
                console.error(`[Tiny API] ❌ No data received after retries`);
                break;
            }

            // DETAILED LOGGING for empty responses
            if (data.retorno?.status_processamento === 3 || !data.retorno?.pedidos) {
                console.log(`[Tiny API] ⚠️ Empty response for ${tinyStartDate} to ${tinyEndDate}`);
                console.log(`[Tiny API] 📋 Status: ${data.retorno?.status_processamento}`);
                console.log(`[Tiny API] 📋 Message: ${data.retorno?.status || data.retorno?.codigo_erro || 'No message'}`);
                console.log(`[Tiny API] 📋 Full response:`, JSON.stringify(data).substring(0, 500));
                hasMore = false;
            } else {
                const orders = data.retorno.pedidos;
                allOrders = [...allOrders, ...orders];
                console.log(`[Tiny API] ✅ Page ${page} received ${orders.length} orders. Total so far: ${allOrders.length}`);

                // DEBUG: Log first order structure to see available fields
                // if (orders.length > 0 && page === 1) {
                //     console.log(`[Tiny API] 🔍 Raw Order Structure:`, JSON.stringify(orders[0], null, 2));
                // }

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

    // Filter out cancelled orders (Case insensitive)
    let validOrders = allOrders.filter(o => {
        const status = o.pedido?.situacao || "";
        return status.toLowerCase() !== 'cancelado';
    });

    console.log(`[Tiny API] ✅ ${validOrders.length} pedidos válidos (de ${allOrders.length} totais)`);

    // Map and extract values
    let mappedOrders = validOrders.map((o: any) => {
        const pedido = o.pedido || o;
        const rawValue = pedido.valor_total || pedido.valor || pedido.total_pedido || pedido.total || "0";
        const total = parseCurrency(rawValue);

        return {
            id: pedido.id || pedido.numero || "N/A",
            date: pedido.data_pedido || "",
            total: total,
            status: pedido.situacao || "",
            // In basic API, customer data is directly in pedido, not pedido.cliente
            customerCpfCnpj: pedido.cpf_cnpj || pedido.cnpj || "",
            customerName: pedido.nome || pedido.nome_cliente || "",
            customerEmail: pedido.email || "",
            seller: pedido.nome_vendedor || pedido.vendedor || "", // Map seller name
            raw: pedido
        };
    });

    // Log sample dates for debugging
    if (mappedOrders.length > 0) {
        const sampleDates = mappedOrders.slice(0, 3).map(o => o.date);
        console.log(`[Tiny API] 📅 Sample order dates: ${sampleDates.join(', ')}`);
    }

    // NOTE: Disabled local date filtering as it was causing issues with 12-month data
    // The Tiny API should filter by `dataInicial` and `dataFinal` parameters
    // If orders are outside range, they should still count towards revenue

    // DEBUG: Check if CPF/CNPJ is being extracted
    const withCpfCnpj = mappedOrders.filter(o => o.customerCpfCnpj && o.customerCpfCnpj.length >= 11).length;
    console.log(`[Tiny API] 🔍 CPF/CNPJ found in ${withCpfCnpj} of ${mappedOrders.length} orders (${((withCpfCnpj / mappedOrders.length) * 100).toFixed(1)}%)`);
    if (mappedOrders.length > 0 && withCpfCnpj > 0) {
        const sample = mappedOrders.find(o => o.customerCpfCnpj);
        console.log(`[Tiny API] 📋 Sample order with CPF/CNPJ:`, {
            id: sample?.id,
            name: sample?.customerName,
            cpfCnpj: sample?.customerCpfCnpj ? `${sample.customerCpfCnpj.substring(0, 3)}***` : 'none'
        });
    }

    console.log(`[Tiny API] ✅ Returning ${mappedOrders.length} orders (no local date filter)`);

    return mappedOrders;
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
