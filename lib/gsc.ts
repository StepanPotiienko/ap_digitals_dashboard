import { google } from "googleapis";
import type { DashboardData, KeywordRow } from "./analytics";

const hasGscConfig = (): boolean => {
  return !!(
    process.env.GSC_SITE_URL &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GSC_CREDENTIALS_JSON)
  );
};

export { hasGscConfig };

/**
 * Fetch Google Search Console metrics for the given date range.
 * @see https://developers.google.com/webmaster-tools/search-console-api-original/v3/searchanalytics
 */
export async function fetchGscMetrics(
  dateFrom: string,
  dateTo: string,
): Promise<Partial<DashboardData> | null> {
  if (!hasGscConfig()) return null;

  try {
    const auth = process.env.GSC_CREDENTIALS_JSON
      ? new google.auth.GoogleAuth({
          credentials: JSON.parse(process.env.GSC_CREDENTIALS_JSON),
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        })
      : new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });

    const searchconsole = google.searchconsole({
      version: "v1",
      auth,
    });

    const siteUrl = process.env.GSC_SITE_URL!;

    // Calculate previous period for delta comparison
    const fromDate = new Date(
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    const toDate = new Date(dateTo || new Date());
    const periodLength = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - periodLength);
    const prevToDate = new Date(fromDate.getTime() - 1000);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Fetch current period metrics
    const currentResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(fromDate),
        endDate: formatDate(toDate),
        dimensions: ["query"],
        rowLimit: 10,
      },
    });

    // Fetch previous period metrics for comparison
    const previousResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(prevFromDate),
        endDate: formatDate(prevToDate),
      },
    });

    const currentRows = currentResponse.data.rows || [];
    const previousData = previousResponse.data.rows?.[0] || {};

    const currentClicks = currentRows.reduce(
      (sum, row) => sum + (row.clicks || 0),
      0,
    );
    const currentImpressions = currentRows.reduce(
      (sum, row) => sum + (row.impressions || 0),
      0,
    );
    const currentCtr =
      currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0;
    const currentPosition =
      currentRows.length > 0
        ? currentRows.reduce((sum, row) => sum + (row.position || 0), 0) /
          currentRows.length
        : 0;

    const previousClicks = previousData.clicks || 0;
    const previousImpressions = previousData.impressions || 0;

    // Parse keywords for top 10
    const keywords: KeywordRow[] = currentRows.slice(0, 10).map((row) => ({
      keyword: row.keys?.[0] || "",
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr ? row.ctr * 100 : 0,
      position: row.position || 0,
      inTop10: (row.position || 0) <= 10,
    }));

    const inTop10Count = keywords.filter((k) => k.inTop10).length;

    return {
      keyMetrics: {
        clicksFromSearch: {
          value: currentClicks,
          delta:
            previousClicks > 0
              ? {
                  value:
                    ((currentClicks - previousClicks) / previousClicks) * 100,
                  label: "vs. минулий період",
                  isImprovement: currentClicks > previousClicks,
                }
              : null,
          source: "Google Search Console",
        },
        impressionsInSearch: {
          value: currentImpressions,
          delta:
            previousImpressions > 0
              ? {
                  value:
                    ((currentImpressions - previousImpressions) /
                      previousImpressions) *
                    100,
                  label: "vs. минулий період",
                  isImprovement: currentImpressions > previousImpressions,
                }
              : null,
          source: "Google Search Console",
        },
      },
      keywords: {
        rows: keywords,
        summary: {
          totalClicks: currentClicks,
          totalImpressions: currentImpressions,
          avgCtr: currentCtr,
          avgPosition: currentPosition,
          inTop10: inTop10Count,
        },
      },
    };
  } catch (error) {
    console.error("Google Search Console API Error:", error);
    return null;
  }
}
