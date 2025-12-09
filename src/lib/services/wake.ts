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
        console.warn("Missing Wake Credentials");
        return [];
    }

    // Wake / Fbits usually filters by dataInicial and dataFinal
    // Check API docs format. Assuming YYYY-MM-DD based on standard REST
    const url = `${WAKE_API_URL}/pedidos?dataInicial=${startDate}&dataFinal=${endDate}`;

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Basic ${WAKE_API_TOKEN}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 300 }
        });

        if (!res.ok) {
            console.error(`Wake Orders Error: ${res.status}`);
            return [];
        }

        const data = await res.json();

        // Return raw list, we will filter in actions.ts
        // Adjust property access based on real response structure (usually data is root or under 'lista')
        return Array.isArray(data) ? data : (data.lista || []);

    } catch (error) {
        console.error("Error fetching Wake orders:", error);
        return [];
    }
}
