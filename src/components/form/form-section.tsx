import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * One group of related fields on an edit page — "Details", "Pricing",
 * "Visibility" — as a shadcn/ui Card with a title and a line saying what the
 * group is for. Every edit page in the admin is a stack of these, so a long
 * form reads as a few named parts instead of one column of boxes.
 */
export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** Controls for the whole section, at the end of its header (e.g. "Add section"). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
