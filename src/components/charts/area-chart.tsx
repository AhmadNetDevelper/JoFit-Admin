import { useId } from "react";

import { ChartFrame } from "./chart-frame";

export interface AreaPoint {
  readonly label: string;
  readonly value: number;
  /** Pre-formatted for the reader — money and dates are locale-bound. */
  readonly display: string;
}

/**
 * A trend over time: one line, a soft fill under it, and a dot on the last
 * point because "where are we now" is the question a trend is usually asked.
 *
 * Drawn from a zero baseline rather than from the minimum. Starting the axis at
 * the lowest value makes an 8% wobble look like a collapse — the oldest way to
 * mislead with a chart, and the easiest to do by accident.
 *
 * Gridlines are drawn behind at quarter heights so a reader can judge a
 * midpoint. They are `--border`, the faintest line in the system: a gridline
 * that competes with the series is worse than none.
 */
export function AreaChart({
  points,
  caption,
  columnHeaders,
  className = "h-56",
}: {
  points: readonly AreaPoint[];
  caption: string;
  columnHeaders: readonly [string, string];
  className?: string;
}) {
  const gradientId = useId();
  const width = 720;
  const height = 240;
  const pad = 8;

  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    x: pad + index * step,
    y: height - pad - (point.value / max) * (height - pad * 2),
  }));

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`).join(" ");
  const area = `${line} L${coords.at(-1)?.x ?? pad} ${height} L${coords[0]?.x ?? pad} ${height} Z`;
  const last = coords.at(-1);

  return (
    <ChartFrame
      caption={caption}
      columnHeaders={columnHeaders}
      rows={points.map((point) => [point.label, point.display] as const)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={`w-full ${className}`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {last ? (
          <circle
            cx={last.x}
            cy={last.y}
            r={4}
            fill="var(--background)"
            stroke="var(--foreground)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
    </ChartFrame>
  );
}
