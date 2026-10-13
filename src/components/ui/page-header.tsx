import type { ReactNode } from "react";

/**
 * Every screen renders exactly one `<h1>` through this component, which keeps
 * the heading hierarchy correct across the admin by construction.
 *
 * Actions sit on the same line at the far end, where the eye lands after the
 * title rather than before it.
 *
 * The short green-to-gold bar over the title is the brand's rule, the one the
 * storefront puts under every section heading. It runs in the reading
 * direction, so it starts green where the eye starts.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  /** Usually a string; a node when the title is someone's own words and needs `dir="auto"`. */
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-prose">
        <span
          aria-hidden="true"
          className="mb-3 block h-1 w-10 rounded-full bg-linear-to-r from-primary to-(--brand-gold) rtl:bg-linear-to-l"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
