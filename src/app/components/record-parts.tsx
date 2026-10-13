import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useTranslation } from "@/i18n";

/**
 * The small pieces every detail screen is built from.
 *
 * They live in `app/` rather than `components/` because they are about how THIS
 * admin lays out a record — a back link, a list of facts, a titled section —
 * not generic UI. Keeping them here is what stops eight detail screens drifting
 * into eight slightly different layouts.
 */

/** The link back to the list a detail screen was opened from. */
export function BackLink({ to }: { to: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ms-2.5 text-muted-foreground hover:text-foreground">
        <Link to={to}>
          {/* The arrow points back along the reading direction. */}
          <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
          {t("action.back")}
        </Link>
      </Button>
    </div>
  );
}

/** An inline link to another record, in the one style every cross-reference uses. */
export function RecordLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

/**
 * A person's name as a link to their customer record. Names are real-world data
 * and are never translated; `dir="auto"` lets an Arabic name sit correctly in an
 * English table and the other way round.
 */
export function CustomerLink({ id, name }: { id: string; name: string }) {
  return (
    <RecordLink to={`/customers/${id}`}>
      <span dir="auto">{name}</span>
    </RecordLink>
  );
}

export interface Fact {
  readonly label: string;
  readonly value: ReactNode;
}

/** Label/value pairs — a real `<dl>`, so the pairing survives a screen reader. */
export function Facts({ facts, columns = 2 }: { facts: readonly Fact[]; columns?: 2 | 3 | 4 }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <dl className={`grid gap-x-6 gap-y-3 text-sm ${grid}`}>
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="mt-0.5 font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled card section. The heading id lets the section be labelled by it. */
export function Section({
  id,
  title,
  description,
  action,
  flush = false,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Edge-to-edge content, for a table that should meet the card's border. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <Card aria-labelledby={`${id}-heading`} className={flush ? "gap-0 pb-0" : undefined}>
      <CardHeader className={flush ? "border-b pb-4" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle id={`${id}-heading`} className="text-sm">
              {title}
            </CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className={flush ? "p-0" : undefined}>{children}</CardContent>
    </Card>
  );
}

