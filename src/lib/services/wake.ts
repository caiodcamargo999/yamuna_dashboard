const WAKE_API_URL = process.env.WAKE_API_URL;
const WAKE_API_TOKEN = process.env.WAKE_API_TOKEN;

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
