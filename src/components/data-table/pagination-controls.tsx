import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui";
import { useFormatters, useTranslation } from "@/i18n";
import type { PageMeta } from "@/types";

/**
 * Paging is server-side: these controls only change the requested page number,
 * which the screen puts in the URL.
 *
 * The chevrons are mirrored with the document (`rtl:-scale-x-100`) rather than
 * swapped, so "previous" points backwards in both languages — in Arabic that is
 * to the right. The order of the four buttons mirrors with the layout on its
 * own, because they sit in a normal flex row.
 */
export function PaginationControls({
  meta,
  onPageChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const { number } = useFormatters();

  const steps = [
    { key: "first", icon: ChevronsLeft, to: 1, disabled: !meta.hasPreviousPage },
    { key: "previous", icon: ChevronLeft, to: meta.page - 1, disabled: !meta.hasPreviousPage },
    { key: "next", icon: ChevronRight, to: meta.page + 1, disabled: !meta.hasNextPage },
    { key: "last", icon: ChevronsRight, to: meta.totalPages, disabled: !meta.hasNextPage },
  ] as const;

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex flex-wrap items-center justify-between gap-4 text-sm"
    >
      <p className="text-muted-foreground" data-figure>
        {t("pagination.records", { count: number(meta.totalItems) })}
      </p>

      <div className="flex items-center gap-2">
        <p aria-live="polite" className="me-2 text-muted-foreground" data-figure>
          {t("pagination.pageOf", {
            page: number(meta.page),
            total: number(meta.totalPages),
          })}
        </p>

        {steps.map((step) => (
          <Button
            key={step.key}
            variant="outline"
            size="icon-sm"
            disabled={step.disabled}
            onClick={() => onPageChange(step.to)}
            aria-label={t(`pagination.${step.key}`)}
            className="rtl:[&_svg]:-scale-x-100"
          >
            <step.icon />
          </Button>
        ))}
      </div>
    </nav>
  );
}
