"use client";

import { useState } from "react";
import type { FunnelStep as FunnelStepType } from "@/lib/analytics";

type FunnelChartProps = {
  steps: FunnelStepType[];
  overallPercent: number;
  leadToClientPercent: number;
};

type Tooltip = { step: FunnelStepType; x: number; y: number } | null;

export default function FunnelChart({
  steps,
  overallPercent,
  leadToClientPercent,
}: FunnelChartProps) {
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  if (!steps?.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]">
        –
      </div>
    );
  }

  const maxVal = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Воронка залучення клієнтів
      </p>
      <div className="space-y-2">
        {steps.map((step) => {
          const pct = maxVal ? (step.value / maxVal) * 100 : 0;

          return (
            <div
              key={step.id}
              className="flex items-center gap-3"
              onMouseMove={(e) => setTooltip({ step, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="w-40 shrink-0 text-xs text-[var(--muted-foreground)]">
                {step.label}
              </span>
              <div className="flex flex-1 items-center gap-2">
                <div
                  className="h-8 rounded bg-[var(--accent-green)]/30 transition-all hover:bg-[var(--accent-green)]/50"
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

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[9999] rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-lg"
          style={{ left: tooltip.x + 15, top: tooltip.y - 40 }}
        >
          <p className="whitespace-nowrap text-sm font-semibold text-[var(--foreground)]">
            {tooltip.step.label}
          </p>
          <p className="mt-1 whitespace-nowrap text-xs text-[var(--muted)]">
            Кількість:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {tooltip.step.value.toLocaleString("uk-UA")}
            </span>
          </p>
          {tooltip.step.percentageOfSessions != null && (
            <p className="whitespace-nowrap text-xs text-[var(--muted)]">
              % від сесій:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {tooltip.step.percentageOfSessions}%
              </span>
            </p>
          )}
        </div>
      )}

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
