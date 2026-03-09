import type { DashboardData, SocialMetric } from "./analytics";

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
  engagement: number;
  impressions: number;
} | null> {
  try {
    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
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

    // Fetch page insights
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_fans,page_impressions,page_post_engagements&period=day&access_token=${pageAccessToken}`,
    );

    if (!insightsResponse.ok) {
      console.error("Failed to fetch Facebook insights");
      return null;
    }

    const insightsData = await insightsResponse.json();
    const insights = insightsData.data || [];

    let subscribers = 0;
    let impressions = 0;
    let engagement = 0;

    insights.forEach((metric: any) => {
      const values = metric.values || [];
      const latestValue = values[values.length - 1]?.value || 0;

      switch (metric.name) {
        case "page_fans":
          subscribers = latestValue;
          break;
        case "page_impressions":
          impressions = latestValue;
          break;
        case "page_post_engagements":
          engagement = latestValue;
          break;
      }
    });

    return { subscribers, engagement, impressions };
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
  try {
    // Fetch Instagram account info
    const accountResponse = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}?fields=followers_count,media_count&access_token=${accessToken}`,
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
      `https://graph.facebook.com/v19.0/${accountId}/insights?metric=impressions,reach,profile_views&period=day&since=${sinceStr}&until=${untilStr}&access_token=${accessToken}`,
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

    const totalEngagement =
      (facebookData?.engagement || 0) + (instagramData?.engagement || 0);
    const totalImpressions =
      (facebookData?.impressions || 0) + (instagramData?.impressions || 0);
    const engagementRate =
      totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : null;

    const facebookSubscribers: SocialMetric = {
      value: facebookData?.subscribers || null,
      delta: null,
      deltaLabel: "vs. минулий місяць",
    };

    const instagramSubscribers: SocialMetric = {
      value: instagramData?.followers || null,
      delta: null,
      deltaLabel: "vs. минулий місяць",
    };

    const totalEngagementMetric: SocialMetric = {
      value: totalEngagement,
      delta: null,
      deltaLabel: "vs. минулий місяць",
    };

    const productViewsFromSocial: SocialMetric = {
      value: totalImpressions,
      delta: null,
      deltaLabel: "vs. минулий місяць",
    };

    return {
      social: {
        facebookSubscribers,
        instagramSubscribers,
        totalEngagement: totalEngagementMetric,
        engagementRate,
        engagementRateTarget: 5.0,
        productViewsFromSocial,
      },
    };
  } catch (error) {
    console.error("Meta API Error:", error);
    return null;
  }
}

export { hasMetaConfig, hasInstagramConfig };
