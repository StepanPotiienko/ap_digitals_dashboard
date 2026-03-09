/**
 * Dashboard data contract – shared shape for API and boilerplate.
 * Null/undefined means "no data" → show "-" in UI.
 */

export type MetricDelta = {
  value: number;
  label: string; // e.g. "vs. минулий місяць"
  isImprovement?: boolean; // e.g. bounce rate down = improvement
};

export type KeyMetric = {
  value: number | string | null;
  delta: MetricDelta | null;
  source: string; // e.g. "GA4 - Acquisition"
};

export type TrafficSource = "organic" | "social" | "direct" | "paid";

export type TrafficByWeek = {
  week: string;
  organic: number;
  social: number;
  direct: number;
  paid: number;
  total: number;
};

export type TrafficShare = {
  source: TrafficSource;
  label: string;
  value: number;
  percentage: number;
};

export type FunnelStep = {
  id: string;
  label: string;
  value: number;
  percentageOfSessions?: number;
};

export type KeywordRow = {
  query: string;
  clicks: number;
  ctr: number;
  position: number;
};

export type KeywordsSummary = {
  avgCtr: number;
  avgPosition: number;
  queriesInTop10: number;
};

export type ChannelRow = {
  channel: string;
  sessions: number;
  newUsers: number;
  bounceRate: number;
  avgTime: string; // "3:12"
  productViews: number;
  leads: number;
  conversion: number;
};

export type SocialMetric = {
  value: number | null;
  delta?: number | null;
  deltaLabel?: string;
};

export type SourceConnectionStatus = {
  ga4: boolean;
  gsc: boolean;
  facebook: boolean;
  instagram: boolean;
  googleAds: boolean;
  linkedInAds: boolean;
};

export type DashboardData = {
  sourceStatus: SourceConnectionStatus;
  keyMetrics: {
    newUsers: KeyMetric;
    clicksFromSearch: KeyMetric;
    impressionsInSearch: KeyMetric;
    leads: KeyMetric;
    bounceRate: KeyMetric;
    avgTimeOnSite: KeyMetric;
  };
  traffic: {
    byWeek: TrafficByWeek[];
    share: TrafficShare[];
    totalSessions: number;
  };
  funnel: {
    steps: FunnelStep[];
    overallConversionPercent: number;
    leadToClientPercent: number;
  };
  keywords: {
    rows: KeywordRow[];
    summary: KeywordsSummary | null;
  };
  social: {
    facebookSubscribers: SocialMetric;
    instagramSubscribers: SocialMetric;
    totalEngagement: SocialMetric;
    engagementRate: number | null;
    engagementRateTarget: number;
    productViewsFromSocial: SocialMetric;
  };
  channels: ChannelRow[];
  b2b: {
    mql: number | null;
    sql: number | null;
    sqlDelta?: number | null;
    closedDeals: number | null;
    closedDealsDelta?: number | null;
    cpl: number | null;
    cplDelta?: number | null;
    mqlToSqlConversion: number | null;
    mqlToSqlTarget: number;
  };
};
