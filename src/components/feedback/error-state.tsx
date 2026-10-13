import type { ReactNode } from "react";

import { Button } from "@/components/ui";
import { useTranslation, type TranslationKey } from "@/i18n";
import { isAppError, type AppErrorCode } from "@/lib";

import { StateMessage } from "./state-message";

/**
 * Maps the data layer's error codes to staff-facing copy. Components never
 * inspect an HTTP status, and the wording lives in the dictionary, which is what
 * makes it exist in both languages.
 *
 * Each line says what happened and what to do about it. None of them apologises
 * — an apology takes the reader's attention without telling them anything.
 */
function messageKeyFor(code: AppErrorCode): TranslationKey {
  return `error.${code}` as TranslationKey;
}

export function ErrorState({
  error,
  title,
  onRetry,
  action,
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  const code = isAppError(error) ? error.code : "unknown";

  return (
    <StateMessage
      tone="error"
      title={title ?? t("state.errorTitle")}
      description={t(messageKeyFor(code))}
      action={
        action ??
        (onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            {t("state.retry")}
          </Button>
        ) : undefined)
      }
    />
  );
}
