import { cn } from "cn";
import { useId, type ReactNode } from "react";

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as FieldRoot,
} from "@/components/ui/field";

/**
 * Wires a label, an optional hint and an error message to a control, and returns
 * the ids the control needs.
 *
 * This is the reason the admin needs no form library: the hard part of forms in
 * practice is accessible labelling and error association, and that is solved
 * here once. Validation lives in the domain; submission lives in
 * `useAsyncAction`.
 *
 * Pass `name` to make the field reachable from the error summary at the top of
 * the form. It must match the key the service returns in `AppError.fieldErrors`.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required,
  requiredMark = true,
  className,
  children,
}: {
  /**
   * The field's key in the service's `fieldErrors` map.
   *
   * When given, the control's id becomes `field-<name>` instead of a generated
   * one, which is what lets `ErrorSummary` link straight to it. Without it the
   * id is still unique and the field still works — it just cannot be jumped to.
   */
  name?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** `false` when a group label already carries the asterisk (a bilingual pair). */
  requiredMark?: boolean;
  /** Spacing overrides — the default leaves room below for the next field. */
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    required: boolean | undefined;
  }) => ReactNode;
}) {
  const generatedId = useId();
  const id = name ? `field-${name}` : generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  /* Laid out with shadcn/ui's Field pieces: label, control, description, error. */
  return (
    <FieldRoot data-invalid={error ? true : undefined} className={cn("mb-5 gap-2", className)}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && requiredMark ? (
          <>
            <span aria-hidden="true" className="-ms-1 text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </FieldLabel>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}
      {hint ? <FieldDescription id={hintId}>{hint}</FieldDescription> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </FieldRoot>
  );
}
