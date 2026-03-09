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

const LABELS: Record<string, string> = {
  organic: "Органіка",
  social: "Соцмережі",
  direct: "Прямий",
  paid: "Платний",
  total: "Всього",
};

type TrafficChartProps = {
  data: TrafficByWeek[];
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3 shadow-lg animate-in fade-in duration-200">
        <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">Тиждень: {label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-[var(--muted)]">{LABELS[item.dataKey] || item.dataKey}:</span>
            </span>
            <span className="font-medium text-[var(--foreground)]">
              {item.value.toLocaleString("uk-UA")}
            </span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between gap-4 border-t border-[var(--card-border)] pt-2 text-xs">
          <span className="font-medium text-[var(--muted)]">Всього:</span>
          <span className="font-semibold text-[var(--foreground)]">
            {total.toLocaleString("uk-UA")}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

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
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'var(--card-border)' }} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => LABELS[value] || value}
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
