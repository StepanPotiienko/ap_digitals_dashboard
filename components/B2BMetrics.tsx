"use client";

import type { DashboardData } from "@/lib/analytics";

type B2BMetricsProps = {
  b2b: DashboardData["b2b"];
};

function formatVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return "–";
  return v.toLocaleString("uk-UA");
}

export default function B2BMetrics({ b2b }: B2BMetricsProps) {
  const meetsTarget =
    b2b.mqlToSqlConversion != null && b2b.mqlToSqlConversion >= b2b.mqlToSqlTarget;

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        В2В метрики для бізнес-замовників
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs text-[var(--muted)]">Кваліфіковані ліди (MQL)</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">{formatVal(b2b.mql)}</p>
          <p className="text-xs text-[var(--muted)]">CRM + GA4 Events</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Продажні ліди (SQL)</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">{formatVal(b2b.sql)}</p>
          {b2b.sqlDelta != null && (
            <p className="text-xs text-[var(--accent-green)]">+{b2b.sqlDelta} vs. минулий місяць</p>
          )}
          <p className="text-xs text-[var(--muted)]">CRM Pipeline</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Закриті угоди</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {formatVal(b2b.closedDeals)}
          </p>
          {b2b.closedDealsDelta != null && (
            <p className="text-xs text-[var(--accent-green)]">+{b2b.closedDealsDelta} vs. минулий місяць</p>
          )}
          <p className="text-xs text-[var(--muted)]">CRM - Closed Won</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Вартість ліда (CPL)</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {b2b.cpl != null ? `$${b2b.cpl}` : "–"}
          </p>
          {b2b.cplDelta != null && (
            <p className="text-xs text-[var(--accent-green)]">
              ${b2b.cplDelta > 0 ? "+" : ""}{b2b.cplDelta} (покращення)
            </p>
          )}
          <p className="text-xs text-[var(--muted)]">Бюджет / Кількість лідів</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">MQL→SQL конверсія</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {b2b.mqlToSqlConversion != null ? `${b2b.mqlToSqlConversion}%` : "–"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Цільовий &gt;{b2b.mqlToSqlTarget}%
            {meetsTarget && (
              <span className="ml-1 text-[var(--accent-green)]" title="Ціль досягнуто">
                ✓
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--muted)]">CRM Funnel</p>
        </div>
      </div>
    </div>
  );
}
