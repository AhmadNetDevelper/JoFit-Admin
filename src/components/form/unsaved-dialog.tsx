import type { useBlocker } from "react-router-dom";

import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

/**
 * The prompt shown when someone navigates away from a form with unsaved edits.
 *
 * It is rendered by the screen rather than by the hook so the wording, and the
 * language it is in, belong to the product — the browser's own dialog on
 * `beforeunload` cannot be either.
 *
 * "Stay" is the primary action and comes first. The reader ended up here by
 * accident far more often than on purpose, and the destructive choice should
 * not be the one under the cursor.
 */
export function UnsavedDialog({ blocker }: { blocker: ReturnType<typeof useBlocker> }) {
  const { t } = useTranslation();

  if (blocker.state !== "blocked") return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-title"
      aria-describedby="unsaved-body"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <h2 id="unsaved-title" className="font-semibold">
          {t("form.unsavedTitle")}
        </h2>
        <p id="unsaved-body" className="mt-2 text-sm text-muted-foreground">
          {t("form.unsavedBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button autoFocus onClick={() => blocker.reset?.()}>
            {t("form.unsavedStay")}
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed?.()}>
            {t("form.unsavedLeave")}
          </Button>
        </div>
      </div>
    </div>
  );
}
