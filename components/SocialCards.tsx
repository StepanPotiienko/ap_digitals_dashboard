"use client";

import type { DashboardData } from "@/lib/analytics";

type SocialCardsProps = {
  social: DashboardData["social"];
};

function formatVal(v: number | null): string {
  if (v === null || v === undefined) return "–";
  return v.toLocaleString("uk-UA");
}

export default function SocialCards({ social }: SocialCardsProps) {
  const meetsTarget =
    social.engagementRate != null && social.engagementRate >= social.engagementRateTarget;

  return (
    <section>
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
        Соцмережі
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Facebook – Підписники</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {formatVal(social.facebookSubscribers.value)}
          </p>
          {social.facebookSubscribers.delta != null && (
            <p className="mt-1 text-xs text-[var(--accent-green)]">
              +{social.facebookSubscribers.delta} {social.facebookSubscribers.deltaLabel}
            </p>
          )}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--background)]">
            <div
              className="h-full rounded bg-[var(--accent-green)]"
              style={{ width: "60%" }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Instagram – Підписники</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {formatVal(social.instagramSubscribers.value)}
          </p>
          {social.instagramSubscribers.delta != null && (
            <p className="mt-1 text-xs text-[var(--accent-green)]">
              +{social.instagramSubscribers.delta} {social.instagramSubscribers.deltaLabel}
            </p>
          )}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--background)]">
            <div
              className="h-full rounded bg-[var(--accent-green)]"
              style={{ width: "45%" }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Загальна залученість (Взаємодія)</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {formatVal(social.totalEngagement.value)}
          </p>
          {social.totalEngagement.delta != null && (
            <p
              className={
                social.totalEngagement.delta >= 0
                  ? "mt-1 text-xs text-[var(--accent-green)]"
                  : "mt-1 text-xs text-[var(--negative)]"
              }
            >
              {social.totalEngagement.delta >= 0 ? "+" : ""}
              {social.totalEngagement.delta}% {social.totalEngagement.deltaLabel}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Engagement Rate</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {social.engagementRate != null ? `${social.engagementRate}%` : "–"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Цільовий: {social.engagementRateTarget}%
            {meetsTarget && (
              <span className="ml-1 text-[var(--accent-green)]" title="Ціль досягнуто">
                ✓
              </span>
            )}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[var(--background)]">
            <div
              className="h-full rounded bg-[var(--accent-green)]"
              style={{
                width: `${
                  social.engagementRate != null
                    ? Math.min(100, (social.engagementRate / Math.max(social.engagementRateTarget, 1)) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
          <p className="text-xs text-[var(--muted)]">Перегляди на сайті з соцмереж</p>
          <p className="text-xl font-semibold text-[var(--foreground)]">
            {formatVal(social.productViewsFromSocial.value)}
          </p>
          {social.productViewsFromSocial.delta != null && (
            <p className="mt-1 text-xs text-[var(--accent-green)]">
              +{social.productViewsFromSocial.delta}% {social.productViewsFromSocial.deltaLabel}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
