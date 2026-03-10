import { createHmac } from "crypto";
import type { DashboardData, SocialMetric } from "./analytics";

function generateAppSecretProof(
  accessToken: string,
  appSecret: string,
): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

const hasMetaConfig = (): boolean => {
  return !!(process.env.META_APP_ID && process.env.META_ACCESS_TOKEN);
};

const hasInstagramConfig = (): boolean => {
  return !!(
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.META_ACCESS_TOKEN
  );
};

interface FacebookPageInsights {
  page_fans?: number;
  page_fan_adds?: number;
  page_impressions?: number;
  page_engaged_users?: number;
  page_post_engagements?: number;
}

interface InstagramInsights {
  follower_count?: number;
  impressions?: number;
  reach?: number;
  profile_views?: number;
}

async function fetchFacebookPageMetrics(accessToken: string): Promise<{
  subscribers: number;
  engagement: number | null;
  impressions: number | null;
} | null> {
  const appSecret = process.env.META_APP_SECRET!;
  const appSecretProof = generateAppSecretProof(accessToken, appSecret);

  try {
    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
    );

    if (!pagesResponse.ok) {
      console.error("Failed to fetch Facebook pages");
      return null;
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      console.log("No Facebook pages found");
      return null;
    }

    // Use the first page
    const page = pages[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token || accessToken;
    const pageProof = generateAppSecretProof(pageAccessToken, appSecret);

    // fan_count/followers_count from page fields (page_fans deprecated in v18+)
    const pageFieldsResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=fan_count,followers_count&access_token=${pageAccessToken}&appsecret_proof=${pageProof}`,
    );
    // page_post_engagements and page_views_total with period=lifetime are valid in v21
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/insights?metric=page_post_engagements,page_views_total&period=lifetime&access_token=${pageAccessToken}&appsecret_proof=${pageProof}`,
    );

    let subscribers = 0;
    let impressions = 0;
    let engagement = 0;

    if (pageFieldsResponse.ok) {
      const pageFields = await pageFieldsResponse.json();
      subscribers = pageFields.followers_count ?? pageFields.fan_count ?? 0;
    }

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      const insights = insightsData.data || [];
      insights.forEach((metric: any) => {
        const values = metric.values || [];
        const raw = values[values.length - 1]?.value;
        const latestValue = typeof raw === "number" ? raw : null;
        if (latestValue === null) return;
        switch (metric.name) {
          case "page_post_engagements":
            engagement = latestValue;
            break;
          case "page_views_total":
            impressions = latestValue;
            break;
        }
      });
    }

    return {
      subscribers,
      engagement: engagement > 0 ? engagement : null,
      impressions: impressions > 0 ? impressions : null,
    };
  } catch (error) {
    console.error("Facebook API Error:", error);
    return null;
  }
}

async function fetchInstagramMetrics(
  accountId: string,
  accessToken: string,
): Promise<{
  followers: number;
  engagement: number;
  impressions: number;
} | null> {
  const appSecret = process.env.META_APP_SECRET!;
  const appSecretProof = generateAppSecretProof(accessToken, appSecret);

  try {
    // Fetch Instagram account info
    const accountResponse = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}?fields=followers_count,media_count&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
    );

    if (!accountResponse.ok) {
      console.error("Failed to fetch Instagram account data");
      return null;
    }

    const accountData = await accountResponse.json();
    const followers = accountData.followers_count || 0;

    // Fetch Instagram insights
    const today = new Date();
    const since = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sinceStr = Math.floor(since.getTime() / 1000);
    const untilStr = Math.floor(today.getTime() / 1000);

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/insights?metric=impressions,reach,profile_views&period=day&since=${sinceStr}&until=${untilStr}&access_token=${accessToken}&appsecret_proof=${appSecretProof}`,
    );

    let impressions = 0;
    let reach = 0;

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      const insights = insightsData.data || [];

      insights.forEach((metric: any) => {
        const values = metric.values || [];
        const totalValue = values.reduce(
          (sum: number, v: any) => sum + (v.value || 0),
          0,
        );

        switch (metric.name) {
          case "impressions":
            impressions = totalValue;
            break;
          case "reach":
            reach = totalValue;
            break;
        }
      });
    }

    // Estimate engagement (impressions or reach as proxy)
    const engagement = impressions > 0 ? impressions : reach;

    return { followers, engagement, impressions };
  } catch (error) {
    console.error("Instagram API Error:", error);
    return null;
  }
}

/**
 * Fetch Facebook/Instagram insights for the given date range.
 * @see https://developers.facebook.com/docs/marketing-api/insights/
 * @see https://developers.facebook.com/docs/instagram-platform/insights/
 */
export async function fetchMetaSocialMetrics(
  _dateFrom: string,
  _dateTo: string,
): Promise<Partial<DashboardData> | null> {
  if (!hasMetaConfig() && !hasInstagramConfig()) return null;

  const accessToken = process.env.META_ACCESS_TOKEN!;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  try {
    const [facebookData, instagramData] = await Promise.all([
      hasMetaConfig()
        ? fetchFacebookPageMetrics(accessToken)
        : Promise.resolve(null),
      hasInstagramConfig() && igAccountId
        ? fetchInstagramMetrics(igAccountId, accessToken)
        : Promise.resolve(null),
    ]);

    const fbEng = facebookData?.engagement ?? null;
    const igEng = instagramData?.engagement ?? null;
    const totalEngagementValue =
      fbEng !== null || igEng !== null ? (fbEng ?? 0) + (igEng ?? 0) : null;

    const fbImp = facebookData?.impressions ?? null;
    const igImp = instagramData?.impressions ?? null;
    const totalImpressions =
      fbImp !== null || igImp !== null ? (fbImp ?? 0) + (igImp ?? 0) : null;

    const engagementRate =
      totalImpressions != null &&
      totalImpressions > 0 &&
      totalEngagementValue != null
        ? (totalEngagementValue / totalImpressions) * 100
        : null;

    return {
      social: {
        facebookSubscribers: {
          value: facebookData?.subscribers ?? null,
          delta: null,
          deltaLabel: "vs. минулий місяць",
        },
        instagramSubscribers: {
          value: instagramData?.followers ?? null,
          delta: null,
          deltaLabel: "vs. минулий місяць",
        },
        totalEngagement: {
          value: totalEngagementValue,
          delta: null,
          deltaLabel: "vs. минулий місяць",
        },
        engagementRate,
        engagementRateTarget: 5.0,
        productViewsFromSocial: {
          value: totalImpressions,
          delta: null,
          deltaLabel: "vs. минулий місяць",
        },
      },
    };
  } catch (error) {
    console.error("Meta API Error:", error);
    return null;
  }
}

export { hasMetaConfig, hasInstagramConfig };
