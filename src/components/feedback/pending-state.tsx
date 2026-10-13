import { Skeleton } from "@/components/ui";
import { useTranslation } from "@/i18n";

/**
 * The placeholder shown while a screen's data is in flight.
 *
 * It draws the shape of what is coming — rows the height of table rows — so the
 * page does not jump when they arrive. The pulse is the only non-interactive
 * motion in the admin, and `prefers-reduced-motion` removes it.
 */
export function PendingState({ label, rows = 4 }: { label?: string; rows?: number }) {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">{label ?? t("state.loading")}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
