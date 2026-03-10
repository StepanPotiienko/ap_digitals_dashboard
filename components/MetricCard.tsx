"use client";

import type { KeyMetric } from "@/lib/analytics";

type MetricCardProps = {
  title: string;
  metric: KeyMetric;
};

function formatValue(v: number | string | null): string {
  if (v === null || v === undefined) return "–";
  if (typeof v === "number") return v.toLocaleString("uk-UA");
  return String(v);
}

export default function MetricCard({ title, metric }: MetricCardProps) {
  const value = formatValue(metric.value);
  const hasDelta = metric.delta != null && metric.value != null;
  const label = metric.delta?.label ?? "";
  const isImprovementLabel = /покращення/i.test(label);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">{title}</p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {hasDelta && (
        <p className="mt-1 text-xs text-[var(--accent-green)]">
          {metric.delta!.value > 0 && "▲ "}
          {metric.delta!.value < 0 && "▼ "}
          {metric.delta!.value > 0 ? "+" : ""}
          {metric.delta!.value.toFixed(1)}%
          {isImprovementLabel ? ` (${label.trim()})` : ` vs. ${label.replace(/^vs\.?\s*/i, "").trim() || "минулий місяць"}`}
        </p>
      )}
      <p className="mt-2 text-xs text-[var(--muted)]">{metric.source}</p>
    </div>
  );
}
