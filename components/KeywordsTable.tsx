"use client";

import type { KeywordRow, KeywordsSummary } from "@/lib/analytics";

type KeywordsTableProps = {
  rows: KeywordRow[];
  summary: KeywordsSummary | null;
};

export default function KeywordsTable({ rows, summary }: KeywordsTableProps) {
  const hasData = rows?.length > 0;

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Топ ключові слова
      </p>
      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-[var(--muted)]">–</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                  <th className="pb-2 pr-4 font-medium">Запит</th>
                  <th className="pb-2 pr-4 font-medium">Кліки</th>
                  <th className="pb-2 pr-4 font-medium">CTR</th>
                  <th className="pb-2 font-medium">Поз.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 pr-4 text-[var(--foreground)]">{row.query}</td>
                    <td className="py-2 pr-4">{row.clicks}</td>
                    <td className="py-2 pr-4">{row.ctr}%</td>
                    <td className="py-2">{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summary && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
              <span>Сер. CTR: {summary.avgCtr}%</span>
              <span>Сер. позиція: {summary.avgPosition}</span>
              <span>Запитів у топ-10: {summary.queriesInTop10}</span>
            </div>
          )}
          <p className="mt-2 text-xs text-[var(--muted)]">
            Останні 30 днів – Google Search Console
          </p>
        </>
      )}
    </div>
  );
}
