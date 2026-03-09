import type { DashboardData } from "./analytics";

const hasMetaConfig = (): boolean => {
  return !!(process.env.META_APP_ID && process.env.META_ACCESS_TOKEN);
};

const hasInstagramConfig = (): boolean => {
  return !!(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.META_ACCESS_TOKEN);
};

/**
 * Fetch Facebook/Instagram insights for the given date range.
 * Replace with Meta Marketing API and Instagram Insights API when credentials are set.
 * @see https://developers.facebook.com/docs/marketing-api/insights/
 * @see https://developers.facebook.com/docs/instagram-platform/insights/
 */
export async function fetchMetaSocialMetrics(
  _dateFrom: string,
  _dateTo: string
): Promise<Partial<DashboardData> | null> {
  if (!hasMetaConfig() && !hasInstagramConfig()) return null;
  // TODO: Call Graph API for Page insights, Instagram account insights (followers, engagement).
  return null;
}

export { hasMetaConfig, hasInstagramConfig };
