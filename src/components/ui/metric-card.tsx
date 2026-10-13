import { cn } from "cn";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { CountUp } from "./count-up";

/**
 * One figure, its change against the previous period, and a line saying what
 * that change means.
 *
 * The sentence is the point. "JOD 1,250, +12.5%" tells a reader what happened;
 * it does not tell them whether to do anything, and a dashboard that only
 * reports makes them work that out four times a morning. Each card carries a
 * claim, and the quiet line under it is the context the claim rests on.
 *
 * The delta shows an arrow and a sign as well as a colour, so the direction
 * survives greyscale and colour blindness.
 *
 * THE TONE is the icon tile's colour and nothing else. It tells four cards in a
 * row apart at a glance; it says nothing about whether the figure is good,
 * which is the delta's job.
 */
export type MetricTone = "green" | "gold" | "teal" | "olive";

const TONES: Readonly<Record<MetricTone, string>> = {
  green: "bg-primary/10 text-primary ring-primary/20",
  gold: "bg-(--brand-gold)/15 text-[#8a6a1f] ring-(--brand-gold)/35 dark:text-(--brand-gold)",
  teal: "bg-chart-3/12 text-chart-3 ring-chart-3/25",
  olive: "bg-chart-4/12 text-chart-4 ring-chart-4/25",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  count,
  ratio,
  claim,
  tone = "green",
}: {
  icon: LucideIcon;
  label: string;
  /** The figure as text. Ignored when `count` is given. */
  value?: ReactNode;
  /** The figure as a number, counted up to on arrival and shown through `format`. */
  count?: { readonly value: number; readonly format: (value: number) => string };
  /** Change against the previous period. `undefined` when there is nothing to compare. */
  ratio?: number;
  claim: string;
  tone?: MetricTone;
}) {
  const up = (ratio ?? 0) >= 0;

  return (
    <Card data-reveal className="relative overflow-hidden">
      <CardHeader>
        <CardTitle>
          <div className={cn("flex size-9 items-center justify-center rounded-xl ring-1 ring-inset", TONES[tone])}>
            <Icon className="size-4.5" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <div data-figure className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {count ? <CountUp value={count.value} format={count.format} /> : value}
          </div>
          {ratio === undefined ? null : (
            <span
              className={cn(
                "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium ring-1 ring-inset",
                up
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300"
                  : "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-300",
              )}
            >
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <span dir="ltr">{`${up ? "+" : "−"}${Math.abs(ratio * 100).toFixed(1)}%`}</span>
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{claim}</p>
      </CardContent>
    </Card>
  );
}
