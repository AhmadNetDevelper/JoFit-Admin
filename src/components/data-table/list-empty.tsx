import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { useTranslation } from "@/i18n";

/**
 * "Nothing matches" inside a list — in place of its rows, never in place of
 * the list. The toolbar above it (the search box that caused it) stays put.
 */
export function ListEmpty({ label, action }: { label?: string; action?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
      <SearchX className="size-6" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{label ?? t("state.noResults")}</p>
      {action}
    </div>
  );
}
