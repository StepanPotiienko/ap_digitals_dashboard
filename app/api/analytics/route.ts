import { NextRequest } from "next/server";
import { hasGa4Config } from "@/lib/ga4";
import { hasGscConfig } from "@/lib/gsc";
import { hasInstagramConfig, hasMetaConfig } from "@/lib/meta";
import { hasCrmConfig } from "@/lib/crm";
import {
  boilerplateDashboardData,
  emptyDashboardData,
} from "@/lib/boilerplate";
import type { DashboardData, SourceConnectionStatus } from "@/lib/analytics";

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: DashboardData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getSourceStatus(): SourceConnectionStatus {
  return {
    ga4: hasGa4Config(),
    gsc: hasGscConfig(),
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
    if (src.keyMetrics)
      target.keyMetrics = { ...target.keyMetrics, ...src.keyMetrics };
    if (
      src.traffic &&
      (src.traffic.byWeek?.length || src.traffic.share?.length)
    )
      target.traffic = { ...target.traffic, ...src.traffic };
    if (
      src.funnel &&
      (src.funnel.steps?.length || src.funnel.overallConversionPercent != null)
    )
      target.funnel = { ...target.funnel, ...src.funnel };
    if (src.keywords && (src.keywords.rows?.length || src.keywords.summary))
      target.keywords = { ...target.keywords, ...src.keywords };
    if (src.social) target.social = { ...target.social, ...src.social };
    if (src.channels?.length) target.channels = src.channels;
    if (src.b2b) target.b2b = { ...target.b2b, ...src.b2b };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  const sourceStatus = getSourceStatus();

  // Check cache
  const cacheKey = `${dateFrom}_${dateTo}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(
      `[Cache HIT] ${cacheKey} - age: ${((now - cached.timestamp) / 1000).toFixed(1)}s`,
    );
    return Response.json(cached.data, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Cache": "HIT",
      },
    });
  }

  console.log(`[Cache MISS] ${cacheKey} - fetching from APIs...`);
  const fetchStart = Date.now();

  // Always fetch real data from APIs (no boilerplate/test data)
  const empty = emptyDashboardData(sourceStatus);
  const [ga4Result, gscResult, metaResult, crmResult] = await Promise.all([
    import("@/lib/ga4").then((m) => m.fetchGa4Metrics(dateFrom, dateTo)),
    import("@/lib/gsc").then((m) => m.fetchGscMetrics(dateFrom, dateTo)),
    import("@/lib/meta").then((m) =>
      m.fetchMetaSocialMetrics(dateFrom, dateTo),
    ),
    import("@/lib/crm").then((m) => m.fetchCrmMetrics(dateFrom, dateTo)),
  ]);
  mergeInto(
    empty,
    ga4Result ?? null,
    gscResult ?? null,
    metaResult ?? null,
    crmResult ?? null,
  );

  const fetchDuration = Date.now() - fetchStart;
  console.log(`[API] Fetched in ${(fetchDuration / 1000).toFixed(2)}s`);

  // Store in cache
  cache.set(cacheKey, { data: empty, timestamp: now });

  // Clean up old cache entries (keep last 10)
  if (cache.size > 10) {
    const sortedEntries = Array.from(cache.entries()).sort(
      (a, b) => b[1].timestamp - a[1].timestamp,
    );
    cache.clear();
    sortedEntries.slice(0, 10).forEach(([key, value]) => cache.set(key, value));
  }

  return Response.json(empty, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "X-Cache": "MISS",
    },
  });
}
