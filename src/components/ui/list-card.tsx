import type { ReactNode } from "react";

import { Card } from "./card";

/**
 * The frame every list screen sits in: a toolbar, the rows, and the pager,
 * inside one card.
 *
 * Before this existed each screen assembled those three itself and they drifted
 * — a search box floating above a bare table on one screen, a card on the next.
 * A list is one object on the page, so it gets one edge around it.
 *
 * The rows get the full width of the card, which is why there is no padding
 * around them: cells supply their own inset, so a long row can be read to the
 * end instead of stopping short of a margin.
 */
export function ListCard({
  toolbar,
  footer,
  children,
}: {
  /** Search and filters. Omitted on lists small enough not to need either. */
  toolbar?: ReactNode;
  /** The pager. On its own ruled strip so it never scrolls with the rows. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-3 border-b p-4">{toolbar}</div>
      ) : null}

      {children}

      {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
    </Card>
  );
}
