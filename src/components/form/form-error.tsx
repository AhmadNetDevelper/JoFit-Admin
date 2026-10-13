import { ErrorState } from "@/components/feedback";
import { useTranslation } from "@/i18n";
import { isAppError } from "@/lib";

import { ErrorSummary } from "./error-summary";

/**
 * What a form shows when a save is rejected.
 *
 * A validation failure is a list of fields, so it renders the summary — the
 * fields render their own messages as well, and on a long page both are
 * needed. Anything else is a failure the reader cannot fix by editing a field,
 * so it renders as an error state with its own copy.
 */
export function FormError({
  error,
  labels,
  summary = true,
}: {
  error?: unknown;
  /** Field key to human label, for the summary's links. */
  labels?: Readonly<Record<string, string>>;
  /**
   * `false` in a short form (a dialog) where every field shows its own error
   * right below it: the summary then lists only errors with no field on this
   * form to land on, so nothing is said twice and nothing is lost.
   */
  summary?: boolean;
}) {
  const { t } = useTranslation();

  if (!error) return null;

  if (isAppError(error) && error.code === "validation" && error.fieldErrors) {
    if (!summary) {
      const orphans = Object.fromEntries(
        Object.entries(error.fieldErrors).filter(([key]) => !labels?.[key]),
      );
      return Object.keys(orphans).length > 0 ? <ErrorSummary fieldErrors={orphans} labels={labels} /> : null;
    }
    return <ErrorSummary fieldErrors={error.fieldErrors} labels={labels} />;
  }

  return <ErrorState error={error} title={t("error.saveTitle")} />;
}
