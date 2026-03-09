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
  { value: "90", label: "90д" },
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
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
      {/* Row 1: logo + title | date controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[var(--accent-green)] font-bold text-[var(--background)]">
            AP
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">AP Digitals</p>
            <p className="text-xs text-[var(--muted)]">
              Agroprosperis Digital Solution — Marketing Dashboard
            </p>
          </div>
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
                      ? "border border-[var(--accent-green)] text-[var(--accent-green)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-green)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Оновлено сьогодні</span>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={useBoilerplate}
              onChange={(e) => onUseBoilerplateChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[var(--card-border)]"
            />
            Тестові дані
          </label>
        </div>
      </div>

      {/* Row 2: source status badges */}
      <div className="border-t border-[var(--card-border)] px-6 py-2">
        <div className="flex flex-wrap items-center gap-3">
          {SOURCES.map(({ key, label, connectLabel }) => {
            const connected = sourceStatus[key];
            return (
              <span
                key={key}
                className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"
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
              </span>
            );
          })}
        </div>
      </div>
    </header>
  );
}
