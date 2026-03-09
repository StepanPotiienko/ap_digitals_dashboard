"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TrafficByWeek } from "@/lib/analytics";

const COLORS = {
  organic: "var(--accent-green)",
  social: "#3b82f6",
  direct: "#71717a",
  paid: "var(--accent-yellow)",
};

type TrafficChartProps = {
  data: TrafficByWeek[];
};

export default function TrafficChart({ data }: TrafficChartProps) {
  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[360px] flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Динаміка трафіку по тижнях
        </p>
        <div className="flex flex-1 items-center justify-center text-[var(--muted)]">–</div>
        <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Google Analytics 4</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Динаміка трафіку по тижнях
      </p>
      <div className="min-h-[280px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                value === "organic"
                  ? "Органіка"
                  : value === "social"
                    ? "Соцмережі"
                    : value === "direct"
                      ? "Прямий"
                      : "Платний"
              }
            />
            <Bar dataKey="organic" stackId="a" fill={COLORS.organic} name="organic" />
            <Bar dataKey="social" stackId="a" fill={COLORS.social} name="social" />
            <Bar dataKey="direct" stackId="a" fill={COLORS.direct} name="direct" />
            <Bar dataKey="paid" stackId="a" fill={COLORS.paid} name="paid" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Google Analytics 4</p>
    </div>
  );
}
