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
        const res = await fetch(url, {
            next: { revalidate: 0 },
            cache: 'no-store'
        });
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
        const insightsRes = await fetch(insightsUrl, {
            next: { revalidate: 0 },
            cache: 'no-store'
        });
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

        // 2. Fetch Creative Details (Images/Videos) for these Ad IDs
        const adIds = rows.map((r: any) => r.ad_id).join(',');
        const adFields = "name,status,creative{image_url,thumbnail_url,video_id,object_type},campaign{objective}";
        const adsUrl = `https://graph.facebook.com/v19.0/?ids=${adIds}&fields=${adFields}&access_token=${ACCESS_TOKEN}`;

        const adsRes = await fetch(adsUrl, {
            next: { revalidate: 0 },
            cache: 'no-store'
        });
        const adsData = await adsRes.json();

        // 3. Fetch video URLs for all video creatives
        const videoIdsToFetch = rows
            .map((r: any) => adsData[r.ad_id]?.creative?.video_id)
            .filter(Boolean);

        const videoUrlMap = new Map<string, string>();

        if (videoIdsToFetch.length > 0) {
            console.log(`[Meta Ads] 🎥 Fetching ${videoIdsToFetch.length} video URLs from Facebook API...`);
            console.log(`[Meta Ads] Video IDs to fetch:`, videoIdsToFetch);

            await Promise.all(
                videoIdsToFetch.map(async (videoId: string) => {
                    try {
                        const videoUrl = `https://graph.facebook.com/v19.0/${videoId}?fields=source&access_token=${ACCESS_TOKEN}`;
                        const videoRes = await fetch(videoUrl);
                        if (videoRes.ok) {
                            const videoData = await videoRes.json();
                            if (videoData.source) {
                                videoUrlMap.set(videoId, videoData.source);
                                console.log(`[Meta Ads] ✅ Video ${videoId} URL fetched successfully`);
                            } else {
                                console.warn(`[Meta Ads] ⚠️ Video ${videoId} has no source field`);
                            }
                        } else {
                            console.error(`[Meta Ads] ❌ Failed to fetch video ${videoId}: ${videoRes.status}`);
                        }
                    } catch (error) {
                        console.error(`[Meta Ads] ❌ Exception fetching video ${videoId}:`, error);
                    }
                })
            );

            console.log(`[Meta Ads] 📊 Successfully fetched ${videoUrlMap.size}/${videoIdsToFetch.length} video URLs`);
        } else {
            console.log(`[Meta Ads] ℹ️ No video ads found in this period`);
        }

        // 4. Merge Data
        return rows.map((row: any) => {
            const adDetails = adsData[row.ad_id] || {};
            const creative = adDetails.creative || {};

            let spend = parseFloat(row.spend || "0");
            let clicks = parseInt(row.clicks || "0");
            let ctr = parseFloat(row.ctr || "0") / 100; // Convert from percentage to decimal
            let cpc = parseFloat(row.cpc || "0");
            let revenue = 0;
            let purchases = 0;
            let leads = 0;
            let roas = 0;

            const actions = row.actions || [];
            for (const action of actions) {
                if (action.action_type === "purchase" || action.action_type === "offsite_conversion.fb_pixel_purchase" || action.action_type === "omni_purchase") {
                    purchases += parseInt(action.value || "0");
                }
                if (action.action_type === "lead" || action.action_type === "offsite_conversion.fb_pixel_lead" || action.action_type === "on_facebook_lead") {
                    leads += parseInt(action.value || "0");
                }
            }

            const actionValues = row.action_values || [];
            for (const val of actionValues) {
                if (
                    val.action_type === "offsite_conversion.fb_pixel_purchase" ||
                    val.action_type === "purchase" ||
                    val.action_type === "omni_purchase"
                ) {
                    revenue += parseFloat(val.value || "0");
                }
            }

            const calculatedRoas = spend > 0 ? revenue / spend : 0;
            if (spend > 0) {
                roas = calculatedRoas;
            }

            const cpa = purchases > 0 ? spend / purchases : 0;
            const cpl = leads > 0 ? spend / leads : 0;

            // Determine creative type and URLs
            const videoId = creative.video_id || null;
            const hasVideo = !!videoId;
            const videoUrl = videoId ? (videoUrlMap.get(videoId) || null) : null;

            return {
                id: row.ad_id,
                name: adDetails.name || row.ad_name,
                status: adDetails.status || "UNKNOWN",
                imageUrl: creative.image_url || creative.thumbnail_url || "",
                videoUrl: videoUrl,
                videoId: videoId,
                creativeType: hasVideo ? 'video' : 'image',
                campaignObjective: adDetails.campaign?.objective || 'UNKNOWN',
                spend,
                clicks,
                ctr,
                cpc,
                roas,
                purchases,
                revenue,
                cpa,
                leads,
                cpl
            };
        }).filter(Boolean);


    } catch (e) {
        console.error("[Meta Ads] Critical Error:", e);
        return [];
    }
}
