import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Field as FieldRoot,
} from "@/components/ui/field";

/**
 * A set of shadcn/ui checkboxes that behaves like one field — categories,
 * sports, specialisations: one legend, one hint, one error, and the
 * `field-<name>` id the error summary links to.
 */
export function CheckboxGroupField({
  name,
  legend,
  hint,
  required,
  error,
  options,
  value,
  onChange,
  columns = 3,
  disabled,
  emptyLabel,
}: {
  name: string;
  legend: string;
  hint?: string;
  required?: boolean;
  error?: string;
  /**
   * `note` is a short muted tag after the label — "pending", "archived".
   * `depth` indents a child under its parent (a sub-category), from 0.
   */
  options: readonly {
    readonly value: string;
    readonly label: string;
    readonly note?: string;
    readonly depth?: number;
  }[];
  value: readonly string[];
  onChange: (next: readonly string[]) => void;
  /** How many columns on a wide screen; always two on a phone. */
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  /** Shown in place of the boxes when there is nothing to choose from yet. */
  emptyLabel?: string;
}) {
  const id = `field-${name}`;
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  const grid = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <FieldSet
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy || undefined}
      aria-invalid={error ? true : undefined}
      data-invalid={error ? true : undefined}
      className="mb-5 gap-3 outline-none"
    >
      <FieldLegend variant="label" className="mb-0">
        {legend}
        {required ? (
          <>
            <span aria-hidden="true" className="ms-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </FieldLegend>
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      {options.length === 0 && emptyLabel ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : null}
      <div data-slot="checkbox-group" className={`grid gap-x-4 gap-y-3 ${grid}`}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <FieldRoot
              key={option.value}
              orientation="horizontal"
              className="gap-2"
              style={option.depth ? { paddingInlineStart: `${option.depth * 1.5}rem` } : undefined}
            >
              <Checkbox
                id={optionId}
                disabled={disabled}
                checked={value.includes(option.value)}
                onCheckedChange={(checked) =>
                  onChange(checked === true ? [...value, option.value] : value.filter((entry) => entry !== option.value))
                }
              />
              <FieldLabel htmlFor={optionId} className="font-normal">
                {option.label}
                {option.note ? (
                  <span className="rounded-md bg-muted px-1.5 py-px text-xs text-muted-foreground">{option.note}</span>
                ) : null}
              </FieldLabel>
            </FieldRoot>
          );
        })}
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </FieldSet>
  );
}
