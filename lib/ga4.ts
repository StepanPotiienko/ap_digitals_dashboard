import type { DashboardData } from "./analytics";

const hasGa4Config = (): boolean => {
  return !!(
    process.env.GA4_PROPERTY_ID &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GA4_CREDENTIALS_JSON)
  );
};

/**
 * Fetch GA4 metrics for the given date range.
 * Replace this with real Google Analytics Data API calls when credentials are set.
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */
export async function fetchGa4Metrics(
  _dateFrom: string,
  _dateTo: string
): Promise<Partial<DashboardData> | null> {
  if (!hasGa4Config()) return null;
  // TODO: Use @google-analytics/data when env is set
  // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  // Run reports for sessions, newUsers, bounceRate, engagement time, channel grouping, events.
  return null;
}

export { hasGa4Config };
