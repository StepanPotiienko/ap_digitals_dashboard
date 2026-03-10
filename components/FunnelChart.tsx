"use client";

import { useState } from "react";
import type { FunnelStep as FunnelStepType } from "@/lib/analytics";

type FunnelChartProps = {
  steps: FunnelStepType[];
  overallPercent: number;
  leadToClientPercent: number;
};

type Tooltip = { step: FunnelStepType; x: number; y: number } | null;

// Solid colors: high-contrast green → amber → red
const FUNNEL_COLORS = [
  "#00e676", // vivid green
  "#69f0ae", // light green
  "#ffea00", // vivid yellow
  "#ff9100", // vivid orange
  "#ff3d00", // deep orange-red
  "#ff1744", // vivid red
  "#d50000", // deep red
  "#b71c1c", // darkest red
];

function getStepColor(idx: number, total: number): string {
  // Interpolate across the palette based on position
  const t = total <= 1 ? 0 : idx / (total - 1);
  const colorIdx = t * (FUNNEL_COLORS.length - 1);
  const lo = Math.floor(colorIdx);
  const hi = Math.min(lo + 1, FUNNEL_COLORS.length - 1);
  if (lo === hi) return FUNNEL_COLORS[lo];
  // simple hex interpolation
  const frac = colorIdx - lo;
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as const;
  const [r1, g1, b1] = parse(FUNNEL_COLORS[lo]);
  const [r2, g2, b2] = parse(FUNNEL_COLORS[hi]);
  const r = Math.round(r1 + (r2 - r1) * frac);
  const g = Math.round(g1 + (g2 - g1) * frac);
  const b = Math.round(b1 + (b2 - b1) * frac);
  return `rgb(${r},${g},${b})`;
}

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

  const sorted = [...steps].sort((a, b) => b.value - a.value);
  const maxVal = Math.max(...sorted.map((s) => s.value), 1);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Воронка залучення клієнтів
      </p>
      <div className="space-y-1.5">
        {sorted.map((step, idx) => {
          const pct = maxVal ? (step.value / maxVal) * 100 : 0;
          const pctOfViews = Math.round(pct);
          const color = getStepColor(idx, sorted.length);

          return (
            <div
              key={step.id}
              className="flex items-center gap-2"
              onMouseMove={(e) => setTooltip({ step, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Label */}
              <span className="w-36 shrink-0 truncate text-xs text-[var(--muted-foreground)]">
                {step.label}
              </span>

              {/* Bar + value + badge */}
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <div
                    className="h-6 rounded transition-all duration-200"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span
                  className="w-14 shrink-0 text-right text-sm font-semibold"
                  style={{ color }}
                >
                  {step.value.toLocaleString("uk-UA")}
                </span>
                {idx > 0 && (
                  <span
                    className="w-10 shrink-0 rounded px-1 py-0.5 text-center text-xs font-bold"
                    style={{
                      backgroundColor: `${color}33`,
                      color,
                      border: `1px solid ${color}66`,
                    }}
                  >
                    {pctOfViews}%
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
          {tooltip.step.value < maxVal && (
            <p className="whitespace-nowrap text-xs text-[var(--muted)]">
              % від переглядів:{" "}
              <span className="font-medium text-[var(--foreground)]">
                {maxVal ? Math.round((tooltip.step.value / maxVal) * 100) : 0}%
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--card-border)] pt-3">
        <span className="flex flex-col">
          <strong className="text-base font-bold" style={{ color: "#00e676" }}>{overallPercent.toFixed(2)}%</strong>
          <span className="text-xs text-[var(--muted-foreground)]">Ліді/Сесії</span>
        </span>
        <span className="flex flex-col">
          <strong className="text-base font-bold" style={{ color: "#ffea00" }}>{leadToClientPercent.toFixed(1)}%</strong>
          <span className="text-xs text-[var(--muted-foreground)]">Закриті Ліди</span>
        </span>
        <span className="flex flex-col">
          <strong className="text-base font-bold" style={{ color: "#ff9100" }}>0.37%</strong>
          <span className="text-xs text-[var(--muted-foreground)]">Загальна конверсія</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Events tracking</p>
    </div>
  );
}
