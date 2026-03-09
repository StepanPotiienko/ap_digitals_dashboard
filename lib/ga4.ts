import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type {
  DashboardData,
  TrafficByWeek,
  TrafficShare,
  ChannelRow,
} from "./analytics";

const hasGa4Config = (): boolean => {
  return !!(
    process.env.GA4_PROPERTY_ID &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GA4_CREDENTIALS_JSON)
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get the Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format week label as "DD.MM - DD.MM"
 */
function getWeekLabel(dateStr: string): string {
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  const date = new Date(year, month, day);
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDay = (d: Date) => {
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${day}.${month}`;
  };

  return `${formatDay(weekStart)} - ${formatDay(weekEnd)}`;
}

/**
 * Fetch GA4 metrics for the given date range.
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */
export async function fetchGa4Metrics(
  dateFrom: string,
  dateTo: string,
): Promise<Partial<DashboardData> | null> {
  if (!hasGa4Config()) return null;

  try {
    const analyticsDataClient = process.env.GA4_CREDENTIALS_JSON
      ? new BetaAnalyticsDataClient({
          credentials: JSON.parse(process.env.GA4_CREDENTIALS_JSON),
        })
      : new BetaAnalyticsDataClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });

    const propertyId = process.env.GA4_PROPERTY_ID!;

    // Calculate previous period for delta comparison
    const fromDate = new Date(
      dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    // Exclude today (incomplete day) to match Looker Studio behavior
    const rawToDate = new Date(dateTo || new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDate =
      rawToDate >= today
        ? new Date(today.getTime() - 24 * 60 * 60 * 1000)
        : rawToDate;
    const periodLength = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - periodLength);
    const prevToDate = new Date(fromDate.getTime() - 1000);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Fetch main metrics
    const [metricsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: formatDate(fromDate), endDate: formatDate(toDate) },
        {
          startDate: formatDate(prevFromDate),
          endDate: formatDate(prevToDate),
        },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
        { name: "conversions" },
      ],
    });

    // Fetch traffic by channel
    const [channelResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: formatDate(fromDate), endDate: formatDate(toDate) },
      ],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "userEngagementDuration" },
        { name: "screenPageViews" },
      ],
    });

    // Fetch traffic by date
    const [dateResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: formatDate(fromDate), endDate: formatDate(toDate) },
      ],
      dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    // Parse main metrics
    const currentMetrics = metricsResponse.rows?.[0]?.metricValues || [];
    const previousMetrics = metricsResponse.rows?.[1]?.metricValues || [];

    const sessions = parseInt(currentMetrics[2]?.value || "0");
    const newUsers = parseInt(currentMetrics[1]?.value || "0");
    const prevNewUsers = parseInt(previousMetrics[1]?.value || "0");
    const bounceRate = parseFloat(currentMetrics[3]?.value || "0") * 100;
    const prevBounceRate = parseFloat(previousMetrics[3]?.value || "0") * 100;
    const avgEngagementTime = parseFloat(currentMetrics[4]?.value || "0");
    const prevAvgEngagementTime = parseFloat(previousMetrics[4]?.value || "0");
    const conversions = parseInt(currentMetrics[5]?.value || "0");

    // Parse traffic by channel
    const channelMap: Record<string, TrafficShare> = {
      organic: {
        source: "organic",
        label: "Органічний",
        value: 0,
        percentage: 0,
      },
      social: { source: "social", label: "Соцмережі", value: 0, percentage: 0 },
      direct: { source: "direct", label: "Прямий", value: 0, percentage: 0 },
      paid: { source: "paid", label: "Платний", value: 0, percentage: 0 },
    };

    const channels: ChannelRow[] = [];
    let totalVisits = 0;

    channelResponse.rows?.forEach((row) => {
      const channelName = row.dimensionValues?.[0]?.value || "Unknown";
      const channelSessions = parseInt(row.metricValues?.[0]?.value || "0");
      const channelNewUsers = parseInt(row.metricValues?.[1]?.value || "0");
      const channelBounceRate =
        parseFloat(row.metricValues?.[2]?.value || "0") * 100;
      const channelEngagementTime = parseInt(
        row.metricValues?.[3]?.value || "0",
      );
      const channelPageViews = parseInt(row.metricValues?.[4]?.value || "0");

      totalVisits += channelSessions;

      // Map to traffic sources
      const lowerChannel = channelName.toLowerCase();
      if (lowerChannel.includes("organic") || lowerChannel.includes("search")) {
        channelMap.organic.value += channelSessions;
      } else if (lowerChannel.includes("social")) {
        channelMap.social.value += channelSessions;
      } else if (lowerChannel.includes("direct")) {
        channelMap.direct.value += channelSessions;
      } else if (
        lowerChannel.includes("paid") ||
        lowerChannel.includes("cpc") ||
        lowerChannel.includes("display")
      ) {
        channelMap.paid.value += channelSessions;
      }

      channels.push({
        channel: channelName,
        sessions: channelSessions,
        newUsers: channelNewUsers,
        bounceRate: channelBounceRate,
        avgTime: formatTime(channelEngagementTime / (channelSessions || 1)),
        productViews: channelPageViews,
        leads: 0,
        conversion: channelSessions > 0 ? (conversions / sessions) * 100 : 0,
      });
    });

    // Calculate percentages
    Object.values(channelMap).forEach((channel) => {
      channel.percentage =
        totalVisits > 0 ? (channel.value / totalVisits) * 100 : 0;
    });

    // Parse traffic by week
    const weeklyData: Record<
      string,
      {
        organic: number;
        social: number;
        direct: number;
        paid: number;
        total: number;
      }
    > = {};

    dateResponse.rows?.forEach((row) => {
      const date = row.dimensionValues?.[0]?.value || "";
      const channel = row.dimensionValues?.[1]?.value?.toLowerCase() || "";
      const sessionCount = parseInt(row.metricValues?.[0]?.value || "0");

      const weekLabel = getWeekLabel(date);

      if (!weeklyData[weekLabel]) {
        weeklyData[weekLabel] = {
          organic: 0,
          social: 0,
          direct: 0,
          paid: 0,
          total: 0,
        };
      }

      if (channel.includes("organic") || channel.includes("search")) {
        weeklyData[weekLabel].organic += sessionCount;
      } else if (channel.includes("social")) {
        weeklyData[weekLabel].social += sessionCount;
      } else if (channel.includes("direct")) {
        weeklyData[weekLabel].direct += sessionCount;
      } else if (channel.includes("paid") || channel.includes("cpc")) {
        weeklyData[weekLabel].paid += sessionCount;
      }

      weeklyData[weekLabel].total += sessionCount;
    });

    const trafficByWeek: TrafficByWeek[] = Object.entries(weeklyData).map(
      ([week, data]) => ({
        week,
        ...data,
      }),
    );

    return {
      keyMetrics: {
        newUsers: {
          value: newUsers,
          delta:
            prevNewUsers > 0
              ? {
                  value: ((newUsers - prevNewUsers) / prevNewUsers) * 100,
                  label: "vs. минулий період",
                  isImprovement: newUsers > prevNewUsers,
                }
              : null,
          source: "GA4 - Acquisition",
        },
        leads: {
          value: conversions,
          delta: null,
          source: "GA4 - Conversions",
        },
        bounceRate: {
          value: `${bounceRate.toFixed(1)}%`,
          delta:
            prevBounceRate > 0
              ? {
                  value: ((bounceRate - prevBounceRate) / prevBounceRate) * 100,
                  label: "vs. минулий період",
                  isImprovement: bounceRate < prevBounceRate,
                }
              : null,
          source: "GA4 - Engagement",
        },
        clicksFromSearch: {
          value: null,
          delta: null,
          source: "GSC",
        },
        impressionsInSearch: {
          value: null,
          delta: null,
          source: "GSC",
        },
        avgTimeOnSite: {
          value: formatTime(avgEngagementTime),
          delta:
            prevAvgEngagementTime > 0
              ? {
                  value:
                    ((avgEngagementTime - prevAvgEngagementTime) /
                      prevAvgEngagementTime) *
                    100,
                  label: "vs. минулий період",
                  isImprovement: avgEngagementTime > prevAvgEngagementTime,
                }
              : null,
          source: "GA4 - Engagement",
        },
      },
      traffic: {
        byWeek: trafficByWeek,
        share: Object.values(channelMap),
        totalSessions: sessions,
      },
      channels,
    };
  } catch (error) {
    console.error("GA4 API Error:", error);
    return null;
  }
}

export { hasGa4Config };
