const ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN;
const ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID; // Should be act_XXXXXXXX

export interface MetaAdsData {
    spend?: number;
    impressions?: number;
    clicks?: number;
    cpc?: number;
    cpm?: number;
    ctr?: number;
    purchase_roas?: number;
    actions?: any;
    error?: string;
}

export async function getMetaAdsInsights(startDate: string, endDate: string): Promise<MetaAdsData | null> {
    if (!ACCESS_TOKEN || !ACCOUNT_ID) {
        return { error: "Missing Credentials" };
    }

    const fields = "spend,impressions,clicks,cpc,cpm,ctr,purchase_roas,actions";
    const time_range = JSON.stringify({ since: startDate, until: endDate });

    // API Version v19.0
    const url = `https://graph.facebook.com/v19.0/${ACCOUNT_ID}/insights?access_token=${ACCESS_TOKEN}&level=account&fields=${fields}&time_range=${time_range}`;

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        if (data.error) {
            console.error("Meta Ads API Error:", data.error);
            return { error: data.error.message };
        }

        const row = data.data?.[0];
        if (!row) return { error: "No Data Rows Returned" };

        // Extract ROAS from purchase_roas array if present
        let roas = 0;
        if (row.purchase_roas && Array.isArray(row.purchase_roas)) {
            const purchaseRoasObj = row.purchase_roas.find((item: any) => item.action_type_numeric_value === 'offsite_conversion.fb_pixel_purchase' || item.action_type === 'omni_purchase');
            roas = purchaseRoasObj ? parseFloat(purchaseRoasObj.value) : 0;
        }

        return {
            spend: parseFloat(row.spend || "0"),
            impressions: parseInt(row.impressions || "0"),
            clicks: parseInt(row.clicks || "0"),
            cpc: parseFloat(row.cpc || "0"),
            cpm: parseFloat(row.cpm || "0"),
            ctr: parseFloat(row.ctr || "0"),
            purchase_roas: roas,
            actions: row.actions
        };

    } catch (error) {
        console.error("Error fetching Meta Ads data:", error);
        return null;
    }
}

export async function getMetaTopCreatives(startDate: string, endDate: string) {
    if (!ACCESS_TOKEN || !ACCOUNT_ID) return [];

    console.log(`[Meta Ads] Fetching Top Creatives (Insights-First Strategy)...`);
    const time_range = JSON.stringify({ since: startDate, until: endDate });

    // 1. Fetch Ad Insights (Performance)
    // We want the top spending ads in this period.
    const insightsFields = "ad_id,ad_name,spend,clicks,ctr,cpc,purchase_roas,actions,action_values";
    const insightsUrl = `https://graph.facebook.com/v19.0/${ACCOUNT_ID}/insights?access_token=${ACCESS_TOKEN}&level=ad&fields=${insightsFields}&time_range=${time_range}&sort=spend_descending&limit=20`;

    try {
        const insightsRes = await fetch(insightsUrl, { next: { revalidate: 300 } });
        const insightsData = await insightsRes.json();

        // LOG RAW RESPONSE TO DEBUG
        console.log(`[Meta Ads Debug] Insights Status: ${insightsRes.status}`);
        if (insightsData.error) {
            console.error("[Meta Ads Debug] API Error:", JSON.stringify(insightsData.error, null, 2));
            return { error: insightsData.error.message };
        }

        const rows = insightsData.data || [];
        console.log(`[Meta Ads Debug] Data Rows Found: ${rows.length}`);

        if (rows.length === 0) {
            console.log("[Meta Ads] No performance data found for this period.");
            return [];
        }

        // 2. Fetch Creative Details (Images) for these Ad IDs
        const adIds = rows.map((r: any) => r.ad_id).join(',');
        const adFields = "name,status,creative{image_url,thumbnail_url}";
        const adsUrl = `https://graph.facebook.com/v19.0/?ids=${adIds}&fields=${adFields}&access_token=${ACCESS_TOKEN}`;

        const adsRes = await fetch(adsUrl, { next: { revalidate: 3600 } });
        const adsData = await adsRes.json();

        // 3. Merge Data
        return rows.map((row: any) => {
            const adDetails = adsData[row.ad_id] || {};
            const creative = adDetails.creative || {};

            // Calculate Metrics
            const spend = parseFloat(row.spend || "0");
            const clicks = parseInt(row.clicks || "0");
            const ctr = parseFloat(row.ctr || "0"); // API usually returns rate as percentage, e.g. "1.5" for 1.5%
            const cpc = parseFloat(row.cpc || "0");

            // Calculate ROAS
            let roas = 0;
            if (row.purchase_roas && Array.isArray(row.purchase_roas)) {
                const roasObj = row.purchase_roas.find((item: any) => item.action_type === 'omni_purchase');
                roas = roasObj ? parseFloat(roasObj.value) : 0;
            }

            // Calculate Purchases
            let purchases = 0;
            if (row.actions && Array.isArray(row.actions)) {
                const purchObj = row.actions.find((item: any) => item.action_type === 'omni_purchase' || item.action_type === 'purchase');
                purchases = purchObj ? parseInt(purchObj.value) : 0;
            }

            // Calculate Leads
            let leads = 0;
            if (row.actions && Array.isArray(row.actions)) {
                const leadItems = row.actions.filter((item: any) =>
                    item.action_type === 'lead' ||
                    item.action_type === 'on_facebook_lead' ||
                    item.action_type === 'contact'
                );
                leads = leadItems.reduce((acc: number, item: any) => acc + parseInt(item.value), 0);
            }

            // Calculate Revenue
            let revenue = 0;
            if (row.action_values && Array.isArray(row.action_values)) {
                const revObj = row.action_values.find((item: any) => item.action_type === 'omni_purchase' || item.action_type === 'purchase');
                revenue = revObj ? parseFloat(revObj.value) : 0;
            }

            // Enforce Consistency: Calculate ROAS from Revenue / Spend if possible
            const calculatedRoas = spend > 0 ? revenue / spend : 0;
            // Use calculated ROAS to match the table columns perfectly if spend > 0
            if (spend > 0) {
                roas = calculatedRoas;
            }

            const cpa = purchases > 0 ? spend / purchases : 0;
            const cpl = leads > 0 ? spend / leads : 0;

            return {
                id: row.ad_id,
                name: adDetails.name || row.ad_name,
                status: adDetails.status || "UNKNOWN",
                imageUrl: creative.image_url || creative.thumbnail_url || "",
                spend,
                clicks,
                ctr, // NO multiplication by 100
                cpc,
                roas,
                purchases,
                revenue,
                cpa,
                leads,
                cpl
            };
        });

    } catch (e) {
        console.error("[Meta Ads] Critical Error:", e);
        return [];
    }
}
