"use client";

import type { ChannelRow } from "@/lib/analytics";

type ChannelsTableProps = {
  channels: ChannelRow[];
};

export default function ChannelsTable({ channels }: ChannelsTableProps) {
  if (!channels?.length) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Канали залучення – Деталізація
        </p>
        <div className="flex h-[200px] items-center justify-center text-[var(--muted)]">–</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Канали залучення – Деталізація
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
              <th className="pb-2 pr-3 font-medium">КАНАЛ</th>
              <th className="pb-2 pr-3 font-medium">СЕСІЇ</th>
              <th className="pb-2 pr-3 font-medium">НОВІ КОРИСТУВАЧІ</th>
              <th className="pb-2 pr-3 font-medium">ПОКАЗНИК ВІДМОВ</th>
              <th className="pb-2 pr-3 font-medium">СЕР. ЧАС</th>
              <th className="pb-2 pr-3 font-medium">ПЕРЕГЛЯДИ ПРОДУКТУ</th>
              <th className="pb-2 pr-3 font-medium">ЛІДИ</th>
              <th className="pb-2 font-medium">КОНВЕРСІЯ</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((row, i) => (
              <tr key={i} className="border-b border-[var(--card-border)]/50">
                <td className="py-2 pr-3 text-[var(--foreground)]">{row.channel}</td>
                <td className="py-2 pr-3">{row.sessions.toLocaleString("uk-UA")}</td>
                <td className="py-2 pr-3">{row.newUsers.toLocaleString("uk-UA")}</td>
                <td className="py-2 pr-3">{typeof row.bounceRate === 'number' ? row.bounceRate.toFixed(1) : Number(row.bounceRate).toFixed(1)}%</td>
                <td className="py-2 pr-3">{row.avgTime}</td>
                <td className="py-2 pr-3">{row.productViews.toLocaleString("uk-UA")}</td>
                <td className="py-2 pr-3">{row.leads}</td>
                <td className="py-2 text-[var(--accent-green)]">{Number(row.conversion).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
