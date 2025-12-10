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

    console.log(`[Meta Ads] Requesting data for: ${startDate} to ${endDate}`);
    console.log(`[Meta Ads] Time range param: ${time_range}`);

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
        if (!row) {
            console.log('[Meta Ads] No data rows returned');
            return { error: "No Data Rows Returned" };
        }

        console.log(`[Meta Ads] Raw spend from API: ${row.spend}`);

        // Extract ROAS from purchase_roas array if present
        let roas = 0;
        if (row.purchase_roas && Array.isArray(row.purchase_roas)) {
            const purchaseRoasObj = row.purchase_roas.find((item: any) => item.action_type_numeric_value === 'offsite_conversion.fb_pixel_purchase' || item.action_type === 'omni_purchase');
            roas = purchaseRoasObj ? parseFloat(purchaseRoasObj.value) : 0;
        }

        const result = {
            spend: parseFloat(row.spend || "0"),
            impressions: parseInt(row.impressions || "0"),
            clicks: parseInt(row.clicks || "0"),
            cpc: parseFloat(row.cpc || "0"),
            cpm: parseFloat(row.cpm || "0"),
            ctr: parseFloat(row.ctr || "0"),
            purchase_roas: roas,
            actions: row.actions
        };

        console.log(`[Meta Ads] Returning spend: R$ ${result.spend?.toFixed(2) || '0'}`)
        return result;

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

        // Fetch video URLs if needed
        const videoIds = [...new Set(
            rows
                .map((r: any) => adsData[r.ad_id]?.creative?.video_id)
                .filter(Boolean)
        )];

        console.log(`[Meta Ads] 🎥 Fetching ${videoIds.length} video URLs from Facebook API...`);
        console.log(`[Meta Ads] Video IDs to fetch:`, videoIds);

        const videoUrlMap: Record<string, { videoUrl: string; thumbnailUrl: string; embedHtml: string }> = {};

        if (videoIds.length > 0) {
            try {
                // Fetch video data with embed_html, picture, and source
                const videoPromises = videoIds.map(async (videoId) => {
                    try {
                        const videoResponse = await fetch(
                            `https://graph.facebook.com/v19.0/${videoId}?fields=embed_html,picture,source,thumbnails&access_token=${ACCESS_TOKEN}`,
                            { next: { revalidate: 0 }, cache: 'no-store' }
                        );

                        if (!videoResponse.ok) {
                            console.log(`[Meta Ads] ⚠️ Could not fetch video ${videoId}: ${videoResponse.status}`);
                            return null;
                        }

                        const videoData = await videoResponse.json();

                        // Try to extract video URL from embed_html or use source
                        let videoUrl = null;

                        if (videoData.source) {
                            videoUrl = videoData.source;
                        } else if (videoData.embed_html) {
                            // Extract src from iframe in embed_html
                            const srcMatch = videoData.embed_html.match(/src="([^"]+)"/);
                            if (srcMatch) {
                                videoUrl = srcMatch[1];
                            }
                        }

                        const thumbnailUrl = videoData.picture || videoData.thumbnails?.data?.[0]?.uri || null;
                        const embedHtml = videoData.embed_html || null;

                        if (videoUrl) {
                            console.log(`[Meta Ads] ✅ Video ${videoId}: ${videoUrl.substring(0, 50)}...`);
                            return { videoId, videoUrl, thumbnailUrl, embedHtml };
                        } else {
                            console.log(`[Meta Ads] ⚠️ Video ${videoId} has no playable source, using embed fallback if available`);
                            return { videoId, videoUrl: null, thumbnailUrl, embedHtml };
                        }
                    } catch (err) {
                        console.error(`[Meta Ads] Error fetching video ${videoId}:`, err);
                        return null;
                    }
                });

                const videoResults = await Promise.all(videoPromises);
                const successCount = videoResults.filter(v => v && v.videoUrl).length;

                videoResults.forEach(result => {
                    if (result) {
                        videoUrlMap[result.videoId as string] = {
                            videoUrl: result.videoUrl || '', // Might be empty if only embed exists
                            thumbnailUrl: result.thumbnailUrl || '',
                            embedHtml: result.embedHtml || '' // Store embed html
                        };
                    }
                });

                console.log(`[Meta Ads] 📊 Successfully fetched ${successCount}/${videoIds.length} video URLs`);
            } catch (error) {
                console.error('[Meta Ads] Error fetching video URLs:', error);
            }
        }      // 4. Merge Data
        return rows.map((row: any) => {
            const adDetails = adsData[row.ad_id] || {};
            const creative = adDetails.creative || {};

            let spend = parseFloat(row.spend || "0");
            let clicks = parseInt(row.clicks || "0");
            let ctr = parseFloat(row.ctr || "0");

            // Debug CTR only for first row to avoid spam
            if (row === rows[0]) console.log(`[Meta Ads] 🔍 Debug CTR: Raw="${row.ctr}", Parsed=${ctr}`);

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

            return {
                id: row.ad_id,
                name: adDetails.name || row.ad_name,
                status: adDetails.status || "UNKNOWN",
                imageUrl: creative.image_url || creative.thumbnail_url || "",
                videoUrl: null, // Will be populated in the next step
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

        // Map video URLs to results
        const resultsWithVideos = rows.map((creative: any) => {
            if (creative.creativeType === 'video' && creative.videoId && videoUrlMap[creative.videoId]) {
                const mapped = videoUrlMap[creative.videoId];
                return {
                    ...creative,
                    videoUrl: mapped.videoUrl || null,
                    thumbnailUrl: mapped.thumbnailUrl || null,
                    embedHtml: mapped.embedHtml || null // Pass embed HTML
                };
            }
            return creative;
        });

        console.log(`[Meta Ads] 📹 Final creative data:`, resultsWithVideos.slice(0, 3).map((c: any) => ({
            name: c.name,
            type: c.creativeType,
            hasVideo: !!c.videoUrl,
            hasThumbnail: !!c.thumbnailUrl
        })));

        return resultsWithVideos;

    } catch (e) {
        console.error("[Meta Ads] Critical Error:", e);
        return [];
    }
}
