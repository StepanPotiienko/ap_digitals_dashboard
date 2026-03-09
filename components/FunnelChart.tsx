"use client";

import type { FunnelStep as FunnelStepType } from "@/lib/analytics";

type FunnelChartProps = {
  steps: FunnelStepType[];
  overallPercent: number;
  leadToClientPercent: number;
};

export default function FunnelChart({
  steps,
  overallPercent,
  leadToClientPercent,
}: FunnelChartProps) {
  if (!steps?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]">
        –
      </div>
    );
  }

  const maxVal = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Воронка залучення клієнтів
      </p>
      <div className="space-y-2">
        {steps.map((step) => {
          const pct = maxVal ? (step.value / maxVal) * 100 : 0;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs text-[var(--muted-foreground)]">
                {step.label}
              </span>
              <div className="flex flex-1 items-center gap-2">
                <div
                  className="h-8 rounded bg-[var(--accent-green)]/30 transition-all"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {step.value.toLocaleString("uk-UA")}
                </span>
                {step.percentageOfSessions != null && (
                  <span className="text-xs text-[var(--muted)]">
                    {step.percentageOfSessions}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <span className="text-[var(--foreground)]">
          <strong>{overallPercent.toFixed(2)}%</strong>
          <span className="ml-1.5 text-[var(--muted-foreground)]">Перехід із сесії в клієнти</span>
        </span>
        <span className="text-[var(--foreground)]">
          <strong>{leadToClientPercent.toFixed(1)}%</strong>
          <span className="ml-1.5 text-[var(--muted-foreground)]">Ліди → Клієнти</span>
        </span>
        <span className="text-[var(--foreground)]">
          <strong>0.37%</strong>
          <span className="ml-1.5 text-[var(--muted-foreground)]">Загальна конверсія</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Events tracking</p>
    </div>
  );
}
