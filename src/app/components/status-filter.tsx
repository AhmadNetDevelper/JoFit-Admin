import { ToggleGroup, ToggleGroupItem } from "@/components/ui";
import { useTranslation, type TranslationKey } from "@/i18n";

/**
 * The status chips on a list toolbar. Multi-select, because "pending or
 * confirmed" — everything still to happen — is the question most queues ask.
 */
export function StatusFilter<TStatus extends string>({
  statuses,
  value,
  onChange,
  labelOf,
}: {
  statuses: readonly TStatus[];
  value: readonly TStatus[] | undefined;
  onChange: (next: readonly TStatus[]) => void;
  /** A domain's own words for its statuses; otherwise the shared `statusLabel.*`. */
  labelOf?: (status: TStatus) => string;
}) {
  const { t } = useTranslation();
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="sm"
      aria-label={t("field.status")}
      value={[...(value ?? [])]}
      onValueChange={(next) => onChange(next as TStatus[])}
      className="flex-wrap"
    >
      {statuses.map((status) => (
        <ToggleGroupItem key={status} value={status}>
          {labelOf?.(status) ??
            (t(`statusLabel.${status}` as TranslationKey) as string | undefined) ??
            status.replace(/-/g, " ")}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
