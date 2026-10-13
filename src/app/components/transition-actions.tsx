import { useState } from "react";

import { Field, FormError } from "@/components/form";
import { Button, Textarea } from "@/components/ui";
import { useTranslation, type TranslationKey } from "@/i18n";
import type { AppError } from "@/lib";

/**
 * The buttons that move a record along its status graph.
 *
 * Every lifecycle in the admin — orders, hires, coaching sessions, course
 * places — is a graph the domain declares, and this renders only the moves the
 * graph allows from where the record is now. A final state shows a sentence
 * rather than a row of disabled buttons.
 *
 * Some moves need a reason (cancelling a session a customer paid for). Those do
 * not fire on the first click: the reason box opens, and the move happens on
 * confirm, so the reason is written before the decision rather than after it.
 * The service still enforces the rule — this only makes the UI honest about it.
 *
 * Button labels are the same translated status words `StatusBadge` shows, so
 * the button and the badge it produces always read alike.
 */
export function TransitionActions<TStatus extends string>({
  next,
  needsNote,
  onRun,
  disabled,
  pending,
  error,
  fieldError,
  emptyLabel,
}: {
  next: readonly TStatus[];
  needsNote?: (status: TStatus) => boolean;
  onRun: (status: TStatus, note?: string) => void;
  disabled?: boolean;
  pending?: boolean;
  error?: AppError;
  fieldError?: string;
  /** Shown when the record is in a final state. */
  emptyLabel: string;
}) {
  const { t } = useTranslation();
  const [noting, setNoting] = useState<TStatus | null>(null);
  const [note, setNote] = useState("");

  if (next.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const isDanger = (status: TStatus) => status === "cancelled" || status === "hidden";
  const label = (status: TStatus): string =>
    (t(`statusLabel.${status}` as TranslationKey) as string | undefined) ?? status.replace(/-/g, " ");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {next.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={isDanger(status) ? "destructive" : "outline"}
            disabled={disabled || pending}
            aria-pressed={noting === status}
            onClick={() => {
              if (needsNote?.(status)) {
                setNoting(status);
                return;
              }
              onRun(status);
            }}
          >
            {label(status)}
          </Button>
        ))}
      </div>

      {noting ? (
        <div className="mt-4 max-w-lg rounded-xl border bg-muted/30 p-4">
          <Field label={`${t("field.reason")} — ${label(noting)}`} error={fieldError} required className="mb-3">
            {(props) => (
              <Textarea {...props} rows={3} autoFocus value={note} onChange={(event) => setNote(event.target.value)} />
            )}
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled || pending}
              onClick={() => onRun(noting, note)}
            >
              {t("action.confirm")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNoting(null);
                setNote("");
              }}
            >
              {t("action.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <FormError error={error} labels={{ note: t("field.reason") }} />
    </div>
  );
}
