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
    try {
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateDays, useBoilerplate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted)]">Завантаження…</p>
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
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
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
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
            Трафік та поведінка
          </h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="flex lg:col-span-2">
              <TrafficChart data={d.traffic?.byWeek ?? []} />
            </div>
            <div className="flex">
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
          <div className="grid gap-6 lg:grid-cols-2">
            <FunnelChart
              steps={d.funnel?.steps ?? []}
              overallPercent={d.funnel?.overallConversionPercent ?? 0}
              leadToClientPercent={d.funnel?.leadToClientPercent ?? 0}
            />
            <KeywordsTable
              rows={d.keywords?.rows ?? []}
              summary={d.keywords?.summary ?? null}
            />
          </div>
        </section>

        <section>
          <SocialCards social={d.social ?? ({} as DashboardData["social"])} />
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
