import { NextRequest } from "next/server";
import { hasGa4Config } from "@/lib/ga4";
import { hasMetaConfig, hasInstagramConfig } from "@/lib/meta";
import { hasCrmConfig } from "@/lib/crm";
import { boilerplateDashboardData, emptyDashboardData } from "@/lib/boilerplate";
import type { DashboardData, SourceConnectionStatus } from "@/lib/analytics";

function getSourceStatus(): SourceConnectionStatus {
  return {
    ga4: hasGa4Config(),
    gsc: !!(process.env.GSC_SITE_URL && process.env.GOOGLE_APPLICATION_CREDENTIALS),
    facebook: hasMetaConfig(),
    instagram: hasInstagramConfig(),
    googleAds: !!process.env.GOOGLE_ADS_CUSTOMER_ID,
    linkedInAds: !!process.env.LINKEDIN_ADS_ACCESS_TOKEN,
  };
}

function mergeInto(
  target: DashboardData,
  ...sources: (Partial<DashboardData> | null)[]
): void {
  for (const src of sources) {
    if (!src) continue;
    if (src.keyMetrics) target.keyMetrics = { ...target.keyMetrics, ...src.keyMetrics };
    if (src.traffic && (src.traffic.byWeek?.length || src.traffic.share?.length)) target.traffic = { ...target.traffic, ...src.traffic };
    if (src.funnel && (src.funnel.steps?.length || src.funnel.overallConversionPercent != null)) target.funnel = { ...target.funnel, ...src.funnel };
    if (src.keywords && (src.keywords.rows?.length || src.keywords.summary)) target.keywords = { ...target.keywords, ...src.keywords };
    if (src.social) target.social = { ...target.social, ...src.social };
    if (src.channels?.length) target.channels = src.channels;
    if (src.b2b) target.b2b = { ...target.b2b, ...src.b2b };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const useBoilerplate = searchParams.get("useBoilerplate") === "true";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  const sourceStatus = getSourceStatus();
  const anyConfigured =
    sourceStatus.ga4 ||
    sourceStatus.gsc ||
    sourceStatus.facebook ||
    sourceStatus.instagram ||
    sourceStatus.googleAds ||
    sourceStatus.linkedInAds;

  if (useBoilerplate || !anyConfigured) {
    return Response.json({
      ...boilerplateDashboardData,
      sourceStatus,
    } as DashboardData);
  }

  const empty = emptyDashboardData(sourceStatus);
  const [ga4Result, metaResult, crmResult] = await Promise.all([
    import("@/lib/ga4").then((m) => m.fetchGa4Metrics(dateFrom, dateTo)),
    import("@/lib/meta").then((m) => m.fetchMetaSocialMetrics(dateFrom, dateTo)),
    import("@/lib/crm").then((m) => m.fetchCrmMetrics(dateFrom, dateTo)),
  ]);
  mergeInto(empty, ga4Result ?? null, metaResult ?? null, crmResult ?? null);
  return Response.json(empty);
}
