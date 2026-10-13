import { useState } from "react";

import { Field } from "@/components/form";
import { Input } from "@/components/ui";
import { parseMoneyInput, toMoneyInputValue } from "@/lib";
import type { Money } from "@/types";

import { toNumber } from "./form-helpers";

/*
 * Inputs the coach and course editors share. Both are shadcn/ui `Input`s; what
 * they add is the parsing.
 *
 * Numbers and prices are kept as the text being typed ("12." is on its way to
 * "12.5") and reported upward as the value the service expects. Anything that
 * does not parse is reported as NaN, so the service's own rule answers it on
 * the field — the form never runs a second copy of the validation that could
 * drift from the first.
 *
 * A list of choices is `CheckboxGroupField` from `@/components/form`.
 */

export function NumberField({
  name,
  label,
  hint,
  required,
  error,
  value,
  onChange,
  decimal = false,
  className,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: number;
  onChange: (next: number) => void;
  /** Allows a fraction, e.g. 7.5 hours. */
  decimal?: boolean;
  /** Spacing overrides for the field wrapper. */
  className?: string;
}) {
  const [typed, setTyped] = useState(() => (Number.isFinite(value) ? String(value) : ""));
  return (
    <Field name={name} label={label} hint={hint} required={required} error={error} className={className}>
      {(props) => (
        <Input
          {...props}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          dir="ltr"
          value={typed}
          onChange={(event) => {
            setTyped(event.target.value);
            onChange(toNumber(event.target.value));
          }}
        />
      )}
    </Field>
  );
}

/**
 * A price in dinars, typed in major units ("24.500") and reported in minor
 * units. Blank is "no price" when the field is optional and a missing one
 * (NaN) when it is required — never a silent zero.
 */
export function MoneyField({
  name,
  label,
  hint,
  required,
  error,
  value,
  onChange,
  className,
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: Money | undefined;
  onChange: (next: Money | undefined) => void;
  /** Spacing overrides for the field wrapper. */
  className?: string;
}) {
  const [typed, setTyped] = useState(() =>
    value && Number.isFinite(value.amount) ? toMoneyInputValue(value) : "",
  );
  const unparsed: Money = { amount: Number.NaN, currency: "JOD" };
  return (
    <Field name={name} label={label} hint={hint} required={required} error={error} className={className}>
      {(props) => (
        /* Left to right in both languages, so the figure and its currency code
           read "24.500 JOD" and the padding sits on the same side as the code. */
        <div dir="ltr" className="relative">
          <Input
            {...props}
            type="text"
            inputMode="decimal"
            placeholder="0.000"
            value={typed}
            onChange={(event) => {
              const next = event.target.value;
              setTyped(next);
              if (next.trim() === "") onChange(required ? unparsed : undefined);
              else onChange(parseMoneyInput(next, "JOD") ?? unparsed);
            }}
            className="pe-12"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-xs font-medium text-muted-foreground"
          >
            JOD
          </span>
        </div>
      )}
    </Field>
  );
}
