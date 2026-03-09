"use client";

import type { SourceConnectionStatus } from "@/lib/analytics";

const SOURCES: { key: keyof SourceConnectionStatus; label: string; connectLabel?: string }[] = [
  { key: "ga4", label: "Google Analytics 4" },
  { key: "gsc", label: "Google Search Console" },
  { key: "facebook", label: "Facebook Insights" },
  { key: "instagram", label: "Instagram Insights" },
  { key: "googleAds", label: "Google Ads", connectLabel: "підключити" },
  { key: "linkedInAds", label: "LinkedIn Ads", connectLabel: "підключити" },
];

const DATE_PRESETS = [
  { value: "7", label: "7д" },
  { value: "30", label: "30д" },
  { value: "365", label: "Рік" },
] as const;

type DashboardHeaderProps = {
  sourceStatus: SourceConnectionStatus;
  dateDays: number;
  onDateDaysChange: (days: number) => void;
  updatedToday: boolean;
  onUpdatedTodayChange: (v: boolean) => void;
  useBoilerplate: boolean;
  onUseBoilerplateChange: (v: boolean) => void;
};

export default function DashboardHeader({
  sourceStatus,
  dateDays,
  onDateDaysChange,
  updatedToday,
  onUpdatedTodayChange,
  useBoilerplate,
  onUseBoilerplateChange,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--accent-green)] font-bold text-[var(--background)]">
            AP
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            AP Digitals – Agroprosperis Digital Solution – Marketing Dashboard
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {SOURCES.map(({ key, label, connectLabel }) => {
            const connected = sourceStatus[key];
            return (
              <button
                key={key}
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition hover:border-[var(--muted)]"
                title={connected ? "Підключено" : "Не підключено"}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: connected ? "var(--accent-green)" : "var(--accent-yellow)",
                  }}
                />
                {label}
                {connectLabel && !connected && (
                  <span className="text-[var(--muted)]">({connectLabel})</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded border border-[var(--card-border)] bg-[var(--background)] p-0.5">
            {DATE_PRESETS.map(({ value, label }) => {
              const days = parseInt(value, 10);
              const active = dateDays === days;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onDateDaysChange(days)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[var(--accent-green)] text-[var(--background)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={updatedToday}
              onChange={(e) => onUpdatedTodayChange(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--card-border)]"
            />
            Оновлено сьогодні
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={useBoilerplate}
              onChange={(e) => onUseBoilerplateChange(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--card-border)]"
            />
            Використати тестові дані
          </label>
        </div>
      </div>
    </header>
  );
}
