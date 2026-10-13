import { CircleAlert, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { TableThumbnail } from "@/components/data-table";
import { Field } from "@/components/form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import type { ApplicationStatus, EmployerVerificationStatus, JobStatus } from "@/features/careers";
import { useTranslation } from "@/i18n";
import { isAppError, toAppError } from "@/lib";
import type { MediaImage } from "@/types";

import { useCareersLabels } from "./careers-labels";

/*
 * The careers screens' shared pieces: status badges in the marketplace's own
 * words, the employer's logo, the note dialog every refusal goes through, and
 * the line that shows why an action was refused.
 */

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const labels = useCareersLabels();
  return <StatusBadge status={status} label={labels.jobStatus(status)} />;
}

export function VerificationBadge({ status }: { status: EmployerVerificationStatus }) {
  const labels = useCareersLabels();
  return <StatusBadge status={status} label={labels.verification(status)} />;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const labels = useCareersLabels();
  return <StatusBadge status={status} label={labels.appStatus(status)} />;
}

/** A company's logo — contained, never cropped — or the quiet placeholder. */
export function EmployerLogo({ logo, large = false }: { logo: MediaImage | undefined; large?: boolean }) {
  return <TableThumbnail image={logo} fit="contain" className={large ? "size-16" : undefined} />;
}

/**
 * Why an action was refused. A refusal from the service (409, 403) carries
 * its own reason — "Verify the employer first" — which says more than any
 * generic line could, so it is shown as it came; anything else gets the
 * dictionary's words for its code.
 */
export function ActionError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const appError = toAppError(error);
  const own = isAppError(error) && (appError.code === "conflict" || appError.code === "forbidden" || appError.code === "unavailable");
  const message = own ? appError.message : t(`error.${appError.code}`);
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/**
 * A decision that must be explained — rejecting a job, rejecting or suspending
 * an employer. The note is required (checked here in the reader's language,
 * and again by the service), because it is what the employer reads.
 *
 * It stays open until the action settles, so a refusal is shown beside the
 * button that caused it.
 */
export function NoteDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  hint,
  confirmLabel,
  initialNote = "",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  hint?: string;
  confirmLabel: string;
  initialNote?: string;
  onConfirm: (note: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);
  const [pending, setPending] = useState(false);
  const [noteError, setNoteError] = useState<string>();
  const [error, setError] = useState<unknown>();

  const reset = () => {
    setNote(initialNote);
    setNoteError(undefined);
    setError(undefined);
  };

  const submit = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError(t("careers.noteRequired"));
      return;
    }
    if (trimmed.length > 1000) {
      setNoteError(t("careers.noteTooLong"));
      return;
    }
    setPending(true);
    setNoteError(undefined);
    setError(undefined);
    try {
      await onConfirm(trimmed);
      onOpenChange(false);
      reset();
    } catch (cause) {
      const appError = toAppError(cause);
      if (appError.fieldErrors?.note) setNoteError(appError.fieldErrors.note);
      else setError(appError);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent closeLabel={t("crud.close")} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <DialogBody>
            <Field name="note" label={label} hint={hint} required error={noteError}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  dir="auto"
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              )}
            </Field>
            <ActionError error={error} />
          </DialogBody>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                {t("action.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A labelled block of someone's own words: kept as written, direction per paragraph. */
export function WrittenText({ children, empty }: { children: string | undefined; empty: ReactNode }) {
  if (!children?.trim()) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <p dir="auto" className="max-w-prose text-sm leading-relaxed whitespace-pre-line">
      {children}
    </p>
  );
}
