import { CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/i18n";

/**
 * The list of everything wrong with a form, at the top of it.
 *
 * A long form scrolls, so field-level errors can all be off screen when a save
 * is rejected — the reader is told "could not save" and sees nothing wrong with
 * what they are looking at. The summary is what makes a rejection actionable:
 * every message in one place, each one a link that jumps to the field it
 * belongs to.
 *
 * It takes focus when it appears. That is the point of it for anyone not using
 * a mouse: after a failed submit the caret is left wherever it was, and without
 * this they would have to hunt the form for what changed. Focus moves here, the
 * heading is read, and the first link is one Tab away.
 *
 * It does not replace the inline messages. Both are required: the summary says
 * what is wrong overall, the field says what is wrong *here*, and a reader who
 * jumps to a field needs to find the message still attached to it.
 */
export function ErrorSummary({
  fieldErrors,
  labels,
}: {
  fieldErrors?: Readonly<Record<string, string>>;
  /** Field key to human label. Keys with no entry fall back to the key itself. */
  labels?: Readonly<Record<string, string>>;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(fieldErrors ?? {});
  const signature = entries.map(([key]) => key).join("|");

  useEffect(() => {
    if (signature) ref.current?.focus();
  }, [signature]);

  if (entries.length === 0) return null;

  return (
    <Alert ref={ref} tabIndex={-1} variant="destructive" className="mb-4 outline-none focus-visible:ring-3 focus-visible:ring-destructive/20">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>
        <h2>{t("form.errorSummary", { count: entries.length })}</h2>
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-1 grid gap-1 sm:grid-cols-2 sm:gap-x-6">
          {entries.map(([key, message]) => (
            <li key={key}>
              <a
                href={`#field-${key}`}
                className="underline-offset-2 hover:underline focus-visible:underline"
              >
                <span className="font-medium">{labels?.[key] ?? key}</span>
                {`: ${message}`}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
