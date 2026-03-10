"use client";

import type { DashboardData } from "@/lib/analytics";

type SocialCardsProps = {
  social: DashboardData["social"];
};

function formatVal(v: number | null): string {
  if (v === null || v === undefined) return "–";
  return v.toLocaleString("uk-UA");
}

function MetricRow({
  label,
  value,
  delta,
  deltaLabel,
  deltaPositive,
  suffix,
  barPct,
  target,
  targetLabel,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaPositive?: boolean;
  suffix?: string;
  barPct?: number;
  target?: string;
  targetLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-[var(--foreground)]">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-normal text-[var(--muted)]">{suffix}</span>}
      </p>
      {delta != null && (
        <p className={`mt-0.5 text-xs ${deltaPositive !== false ? "text-[var(--accent-green)]" : "text-[var(--negative)]"}`}>
          {deltaPositive !== false && delta >= 0 ? "+" : ""}
          {delta} {deltaLabel}
        </p>
      )}
      {target && (
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {targetLabel}: {target}
        </p>
      )}
      {barPct != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--background)]">
          <div className="h-full rounded bg-[var(--accent-green)]" style={{ width: `${Math.min(100, barPct)}%` }} />
        </div>
      )}
    </div>
  );
}

export default function SocialCards({ social }: SocialCardsProps) {
  const meetsTarget =
    social.engagementRate != null && social.engagementRate >= social.engagementRateTarget;
  const engBarPct =
    social.engagementRate != null
      ? (social.engagementRate / Math.max(social.engagementRateTarget, 1)) * 100
      : 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--foreground)]">Соцмережі</p>
        <p className="text-xs text-[var(--muted)]">Facebook + Instagram Insights</p>
      </div>
      <div className="flex flex-col gap-3">
        <MetricRow
          label="Facebook – Підписники"
          value={formatVal(social.facebookSubscribers.value)}
          delta={social.facebookSubscribers.delta}
          deltaLabel={social.facebookSubscribers.deltaLabel ?? "цього місяця"}
          barPct={60}
        />
        <MetricRow
          label="Instagram – Підписники"
          value={formatVal(social.instagramSubscribers.value)}
          delta={social.instagramSubscribers.delta}
          deltaLabel={social.instagramSubscribers.deltaLabel ?? "цього місяця"}
          barPct={45}
        />
        <MetricRow
          label="Загальна залученість"
          value={formatVal(social.totalEngagement.value)}
          delta={social.totalEngagement.delta}
          deltaLabel={social.totalEngagement.deltaLabel}
          deltaPositive={social.totalEngagement.delta == null || social.totalEngagement.delta >= 0}
        />
        <MetricRow
          label="Engagement Rate"
          value={social.engagementRate != null ? `${social.engagementRate}` : "–"}
          suffix={social.engagementRate != null ? "%" : undefined}
          target={`${social.engagementRateTarget}%${meetsTarget ? " ✓" : ""}`}
          targetLabel="Ціль"
          barPct={engBarPct}
        />
        <MetricRow
          label="Перегляди з соцмереж"
          value={formatVal(social.productViewsFromSocial.value)}
          delta={social.productViewsFromSocial.delta}
          deltaLabel={social.productViewsFromSocial.deltaLabel}
        />
      </div>
    </div>
  );
}
