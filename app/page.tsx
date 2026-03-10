"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardData } from "@/lib/analytics";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCard from "@/components/MetricCard";
import TrafficChart from "@/components/TrafficChart";
import TrafficDonut from "@/components/TrafficDonut";
import FunnelChart from "@/components/FunnelChart";
import KeywordsTable from "@/components/KeywordsTable";
import SocialCards from "@/components/SocialCards";
import ChannelsTable from "@/components/ChannelsTable";
import B2BMetrics from "@/components/B2BMetrics";

function getDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function DashboardPage() {
  const [dateDays, setDateDays] = useState(30);
  const [updatedToday, setUpdatedToday] = useState(false);
  const [useBoilerplate, setUseBoilerplate] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(dateDays);
    const params = new URLSearchParams({
      from,
      to,
      useBoilerplate: String(useBoilerplate),
    });
    
    const startTime = performance.now();
    try {
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: DashboardData = await res.json();
      setData(json);
      
      const duration = performance.now() - startTime;
      console.log(`Data fetched in ${(duration / 1000).toFixed(2)}s`);
    } catch (err) {
      console.error('Fetch error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateDays, useBoilerplate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Only show full-screen loading on initial load
  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--accent-green)]" />
          <p className="text-[var(--muted)]">Завантаження…</p>
        </div>
      </div>
    );
  }

  const d = data ?? ({} as DashboardData);
  const status = d.sourceStatus ?? {
    ga4: false,
    gsc: false,
    facebook: false,
    instagram: false,
    googleAds: false,
    linkedInAds: false,
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Loading overlay when refetching */}
      {loading && data && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--accent-green)]" />
          <span className="text-sm text-[var(--muted)]">Оновлення...</span>
        </div>
      )}
      
      <DashboardHeader
        sourceStatus={status}
        dateDays={dateDays}
        onDateDaysChange={setDateDays}
        updatedToday={updatedToday}
        onUpdatedTodayChange={setUpdatedToday}
        useBoilerplate={useBoilerplate}
        onUseBoilerplateChange={setUseBoilerplate}
      />

      <main className="mx-auto max-w-[1600px] space-y-8 p-6">
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-(--muted)">
            Ключові метрики залучення
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              title="Нові користувачі"
              metric={d.keyMetrics?.newUsers ?? { value: null, delta: null, source: "-" }}
            />
            <MetricCard
              title="Кліки з пошуку"
              metric={d.keyMetrics?.clicksFromSearch ?? { value: null, delta: null, source: "-" }}
            />
            <MetricCard
              title="Покази у пошуку"
              metric={d.keyMetrics?.impressionsInSearch ?? { value: null, delta: null, source: "-" }}
            />
            <MetricCard
              title="Ліди (форми/запити)"
              metric={d.keyMetrics?.leads ?? { value: null, delta: null, source: "-" }}
            />
            <MetricCard
              title="Показник відмов"
              metric={d.keyMetrics?.bounceRate ?? { value: null, delta: null, source: "-" }}
            />
            <MetricCard
              title="Сер. час на сайті"
              metric={d.keyMetrics?.avgTimeOnSite ?? { value: null, delta: null, source: "-" }}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-(--muted)">
            Трафік та поведінка
          </h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="h-full lg:col-span-2">
              <TrafficChart data={d.traffic?.byWeek ?? []} />
            </div>
            <div className="h-full">
              <TrafficDonut
                data={d.traffic?.share ?? []}
                total={d.traffic?.totalSessions ?? 0}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
            Воронка конверсій – ВЕО соцмережі
          </h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="h-full">
              <FunnelChart
                steps={d.funnel?.steps ?? []}
                overallPercent={d.funnel?.overallConversionPercent ?? 0}
                leadToClientPercent={d.funnel?.leadToClientPercent ?? 0}
              />
            </div>
            <div className="h-full">
              <KeywordsTable
                rows={d.keywords?.rows ?? []}
                summary={d.keywords?.summary ?? null}
              />
            </div>
            <div className="h-full">
              <SocialCards social={d.social ?? ({} as DashboardData["social"])} />
            </div>
          </div>
        </section>

        <section>
          <ChannelsTable channels={d.channels ?? []} />
        </section>

        <section>
          <B2BMetrics b2b={d.b2b ?? ({} as DashboardData["b2b"])} />
        </section>
      </main>
    </div>
  );
}
