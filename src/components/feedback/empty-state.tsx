import type { ReactNode } from "react";

import { useTranslation } from "@/i18n";

import { StateMessage } from "./state-message";

/**
 * A successful response with nothing in it. The default copy states the fact and
 * leaves room for the screen to say what to do next, because only the screen
 * knows whether an empty list is normal (a cleared moderation queue) or a prompt
 * to act (a catalogue with no products).
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <StateMessage title={title ?? t("state.empty")} description={description} action={action} />
  );
}
