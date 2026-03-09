"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { TrafficShare } from "@/lib/analytics";

const COLORS = ["var(--accent-green)", "#3b82f6", "#71717a", "var(--accent-yellow)"];

type TrafficDonutProps = {
  data: TrafficShare[];
  total: number;
};

export default function TrafficDonut({ data, total }: TrafficDonutProps) {
  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[360px] flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Джерела трафіку
        </p>
        <div className="flex min-h-[280px] flex-1 items-center justify-center text-[var(--muted)]">–</div>
        <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Google Analytics 4</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.label, value: d.percentage }));

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Джерела трафіку
      </p>
      <div className="relative min-h-[280px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ pointerEvents: "none" }}
        >
          <span className="text-2xl font-semibold text-[var(--foreground)]">
            {total.toLocaleString("uk-UA")}
          </span>
          <span className="text-xs text-[var(--muted)]">всього</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Google Analytics 4</p>
    </div>
  );
}
