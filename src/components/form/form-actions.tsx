import type { ReactNode } from "react";

/**
 * The bar at the foot of an edit page: the primary action (Save / Create) at
 * the reading end, secondary ones beside it, and anything destructive
 * (Delete) set apart at the start. Sticky, so Save is always in reach on a
 * long form; it sits on the page background with a top border rather than
 * floating over the content.
 */
export function FormActions({
  children,
  start,
}: {
  /** Save, Cancel — rendered at the end, in the order given (primary last). */
  children: ReactNode;
  /** Delete, or a status note — rendered at the start. */
  start?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:-mx-6 md:px-6">
      {start ? <div className="flex items-center gap-2">{start}</div> : null}
      <div className="ms-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
