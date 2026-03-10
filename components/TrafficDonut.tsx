"use client";

import { useCallback, useRef, useState } from "react";
import type { TrafficShare } from "@/lib/analytics";

const COLORS = ["var(--accent-green)", "#3b82f6", "#71717a", "var(--accent-yellow)"];
const TOOLTIP_WIDTH = 164;
const CX = 100;
const CY = 100;
const INNER_R = 55;
const OUTER_R = 80;

function polarToCartesian(r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function donutPath(startAngle: number, endAngle: number) {
  const os = polarToCartesian(OUTER_R, startAngle);
  const oe = polarToCartesian(OUTER_R, endAngle);
  const is = polarToCartesian(INNER_R, startAngle);
  const ie = polarToCartesian(INNER_R, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${is.x} ${is.y}`,
    "Z",
  ].join(" ");
}

type TrafficDonutProps = {
  data: TrafficShare[];
  total: number;
};

export default function TrafficDonut({ data, total }: TrafficDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

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

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.percentage,
    count: d.value,
  }));

  // Compute arc angle ranges from data
  const totalVal = chartData.reduce((sum, d) => sum + d.value, 0);
  let cumAngle = 0;
  const segments = chartData.map((d, i) => {
    const startAngle = cumAngle;
    const span = totalVal > 0 ? (d.value / totalVal) * 360 : 0;
    cumAngle += span;
    return { ...d, startAngle, endAngle: startAngle + span, index: i };
  });

  const containerWidth = containerRef.current?.clientWidth ?? 400;
  const containerHeight = containerRef.current?.clientHeight ?? 280;
  const isLeftHalf = mousePos.x < containerWidth / 2;
  const tooltipLeft = isLeftHalf ? mousePos.x + 18 : mousePos.x - TOOLTIP_WIDTH - 18;
  const tooltipTop = Math.min(Math.max(0, mousePos.y - 44), containerHeight - 100);
  const accentColor = hoveredIndex !== null ? COLORS[hoveredIndex % COLORS.length] : "transparent";

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Джерела трафіку
      </p>
      <div
        ref={containerRef}
        className="relative flex min-h-[280px] flex-1 items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Custom SVG donut — onMouseEnter/Leave fire only on exact arc pixels */}
        <svg
          viewBox="0 0 200 200"
          width="200"
          height="200"
          style={{ overflow: "visible" }}
        >
          {segments.map((seg) => (
            <path
              key={seg.index}
              d={donutPath(seg.startAngle, seg.endAngle)}
              fill={COLORS[seg.index % COLORS.length]}
              opacity={hoveredIndex === null || hoveredIndex === seg.index ? 1 : 0.45}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
          {/* Center label rendered in SVG space so it's always correctly centered */}
          <text
            x={CX}
            y={CY - 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="600"
            fill="var(--foreground)"
            fontFamily="inherit"
            style={{ pointerEvents: "none" }}
          >
            {total.toLocaleString("uk-UA")}
          </text>
          <text
            x={CX}
            y={CY + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill="var(--muted)"
            fontFamily="inherit"
            style={{ pointerEvents: "none" }}
          >
            всього
          </text>
        </svg>

        {/* Cursor-following tooltip */}
        {hoveredIndex !== null && (
          <div
            className="pointer-events-none absolute z-50"
            style={{
              left: tooltipLeft,
              top: tooltipTop,
              width: TOOLTIP_WIDTH,
              transition: "left 60ms linear, top 60ms linear",
            }}
          >
            {isLeftHalf ? (
              <div
                style={{
                  position: "absolute",
                  left: -6,
                  top: 44,
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderRight: `6px solid ${accentColor}`,
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: 44,
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: `6px solid ${accentColor}`,
                }}
              />
            )}
            <div
              className="rounded-lg bg-[var(--card)] p-3 shadow-xl"
              style={{ border: `1.5px solid ${accentColor}` }}
            >
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {chartData[hoveredIndex].name}
                </p>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Сесій:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {chartData[hoveredIndex].count.toLocaleString("uk-UA")}
                </span>
              </p>
              <p className="text-xs text-[var(--muted)]">
                Частка:{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {chartData[hoveredIndex].value.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">Джерело: GA4 - Google Analytics 4</p>
    </div>
  );
}
