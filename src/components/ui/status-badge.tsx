import { cn } from "cn";

import { useTranslation, type TranslationKey } from "@/i18n";

import { Badge } from "./badge";

/**
 * Renders a status as a word, with colour as a second channel.
 *
 * The word is the signal. Colour only sorts statuses into what the admin does
 * with them — the five tones below — and a status the map does not know renders
 * as "in hand" rather than throwing, because a new value in the data must never
 * break a queue screen.
 *
 * Shown in the reader's language, with the raw value kept as the tooltip and
 * `data-status`: the words are the domain's own vocabulary, they appear in the
 * API and in support conversations, and someone comparing a screen against a
 * ticket can still hover to see the exact value.
 */
/*
 * FIVE TONES, and the word still carries the meaning.
 *
 *   waiting   amber   someone has to act       pending, new, submitted…
 *   moving    sky     in hand, not finished     confirmed, shipped, interview…
 *   done      green   finished, went well       completed, published, hired…
 *   stopped   red     finished, went badly      cancelled, rejected, flagged…
 *   closed    grey    no longer in play         archived, refunded, draft…
 *
 * They were four Badge variants before — black, grey, outline and red — so a
 * table of orders was a column of near-identical grey pills and "completed"
 * was the loudest thing on the screen, which is backwards: the rows that need
 * someone are the waiting ones. Each tone is a soft fill, a ring one step
 * darker and a dot, so a column of them scans by colour and still reads in
 * greyscale by word.
 */
type Tone = "waiting" | "moving" | "done" | "stopped" | "closed";

const STATUS_TONES: Readonly<Record<string, Tone>> = {
  pending: "waiting",
  new: "waiting",
  "in-review": "waiting",
  upcoming: "waiting",
  closing: "waiting",
  submitted: "waiting",

  confirmed: "moving",
  processing: "moving",
  shipped: "moving",
  collected: "moving",
  quoted: "moving",
  active: "moving",
  open: "moving",
  reviewing: "moving",
  shortlisted: "moving",
  interview: "moving",
  offered: "moving",

  published: "done",
  approved: "done",
  completed: "done",
  returned: "done",
  won: "done",
  visible: "done",
  hired: "done",
  verified: "done",

  cancelled: "stopped",
  rejected: "stopped",
  suspended: "stopped",
  flagged: "stopped",

  draft: "closed",
  archived: "closed",
  refunded: "closed",
  lost: "closed",
  hidden: "closed",
  full: "closed",
  withdrawn: "closed",
};

const TONE_CLASSES: Readonly<Record<Tone, { readonly badge: string; readonly dot: string }>> = {
  waiting: {
    badge: "bg-amber-500/10 text-amber-800 ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/25",
    dot: "bg-amber-500",
  },
  moving: {
    badge: "bg-sky-500/10 text-sky-800 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-300/25",
    dot: "bg-sky-500",
  },
  done: {
    badge: "bg-emerald-500/10 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/25",
    dot: "bg-emerald-500",
  },
  stopped: {
    badge: "bg-red-500/10 text-red-800 ring-red-600/20 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-300/25",
    dot: "bg-red-500",
  },
  closed: {
    badge: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground/50",
  },
};

export function StatusBadge({
  status,
  label: override,
}: {
  status: string;
  /**
   * A domain's own word for a shared status — careers calls a pending job
   * "Waiting for review". The colour still comes from the status.
   */
  label?: string;
}) {
  const { t } = useTranslation();
  const key = `statusLabel.${status}` as TranslationKey;
  /* A missing key comes back undefined; an unknown status then shows itself. */
  const label: string | undefined = override ?? t(key);
  /* An unknown status is "in hand" rather than an error: see the note above. */
  const tone = STATUS_TONES[status] ?? "moving";
  return (
    <Badge
      variant="outline"
      title={status}
      data-status={status}
      data-tone={tone}
      className={cn("gap-1.5 border-transparent ring-1 ring-inset", TONE_CLASSES[tone].badge)}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASSES[tone].dot)} />
      {label ?? status.replace(/-/g, " ")}
    </Badge>
  );
}
