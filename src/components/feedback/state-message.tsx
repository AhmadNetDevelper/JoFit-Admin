import { CircleAlert, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export type StateTone = "neutral" | "error";

export interface StateMessageProps {
  readonly title: string;
  readonly description?: string;
  readonly tone?: StateTone;
  readonly action?: ReactNode;
}

/**
 * The structural primitive behind every non-content state. It fixes the
 * semantics — a labelled region, errors announced assertively — and restyling it
 * restyles every empty, error and unavailable state in the admin.
 *
 * The dashed edge is doing a job, not decorating: it says the sheet is empty
 * rather than merely quiet, so an empty queue never reads as a queue that failed
 * to load. An error keeps the same shape and changes only its edge and its
 * first line, because the difference between "nothing here" and "this broke" is
 * the one thing a person must not misread.
 *
 * Laid out like shadcn/ui's Empty: a centred icon, a title, a line of help and
 * the one action, so every blank screen in the admin looks deliberate.
 */
export function StateMessage({ title, description, tone = "neutral", action }: StateMessageProps) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center ${
        isError ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
      }`}
    >
      <div
        aria-hidden="true"
        className={`mb-2 flex size-10 items-center justify-center rounded-lg ${
          isError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        }`}
      >
        {isError ? <CircleAlert className="size-5" /> : <Inbox className="size-5" />}
      </div>
      <p className={`font-medium ${isError ? "text-destructive" : "text-foreground"}`}>{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-balance text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
