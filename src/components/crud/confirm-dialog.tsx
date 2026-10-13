import { CircleAlert, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toAppError } from "@/lib";
import { useTranslation } from "@/i18n";

/**
 * "Delete X?" — the one confirmation every destructive action goes through,
 * built on shadcn/ui's Alert Dialog.
 *
 * It runs the action itself and stays open until it settles, so a refusal
 * from the API ("still used by 4 products") is shown right here, beside the
 * button that caused it, instead of the dialog closing on a failure.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const run = async () => {
    setPending(true);
    setError(undefined);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (cause) {
      setError(toAppError(cause).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" aria-hidden="true" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? t("crud.deleteBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            /* Radix closes on Action by default; this one closes only when the
               delete has actually succeeded. */
            onClick={(event) => {
              event.preventDefault();
              void run();
            }}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {pending ? t("crud.deleting") : (confirmLabel ?? t("crud.delete"))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
