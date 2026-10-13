import { LOCALES, LOCALE_DIRECTION, LOCALE_LABELS, useTranslation } from "@/i18n";
import type { Locale } from "@/i18n";
import type { LocalizedText } from "@/types";

import { Badge, Button, FieldLegend, FieldSet, Input, Textarea } from "@/components/ui";

import { Field } from "./field";

/**
 * Edits one piece of content in every language at once.
 *
 * Staff see all languages side by side rather than switching the whole admin to
 * Arabic to edit an Arabic description — you cannot translate what you cannot
 * see next to the original.
 *
 * Each input carries its own `dir` and `lang`, so the Arabic box is
 * right-to-left even while the admin is displayed in English.
 *
 * Errors are keyed `field.locale` (e.g. `title.ar`), matching what the service
 * returns from `validationFailed`, so a per-language failure lands on the right
 * box.
 */
export function LocalizedField({
  name,
  label,
  value,
  onChange,
  fieldErrors,
  multiline,
  required,
  hint,
}: {
  name: string;
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  fieldErrors?: Readonly<Record<string, string>>;
  multiline?: boolean;
  required?: boolean;
  hint?: string;
}) {
  const { t } = useTranslation();
  const missing = LOCALES.filter((locale) => (value[locale] ?? "").trim() === "");

  return (
    <FieldSet className="mb-5 gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <FieldLegend variant="label" className="mb-0">
          {label}
          {required ? (
            <span aria-hidden="true" className="ms-0.5 text-destructive">
              *
            </span>
          ) : null}
        </FieldLegend>
        {/* Which languages still need text — at a glance, before saving. */}
        <Badge variant={missing.length === 0 ? "secondary" : "outline"} className="shrink-0 font-normal">
          {missing.length === 0
            ? t("i18n.complete")
            : `${t("i18n.missingIn")}: ${missing.map((locale) => LOCALE_LABELS[locale]).join(", ")}`}
        </Badge>
      </div>

      {/* Side by side on a wide screen, so a translation sits next to its original. */}
      <div className={`grid gap-4 ${multiline ? "" : "sm:grid-cols-2"}`}>
      {LOCALES.map((locale: Locale) => {
        const error = fieldErrors?.[`${name}.${locale}`];
        return (
          <Field
            key={locale}
            /* Matches the `field.locale` key the service returns, so the error
               summary at the top of the form can jump straight to this box. */
            name={`${name}.${locale}`}
            label={LOCALE_LABELS[locale]}
            error={error}
            required={required}
            requiredMark={false}
            className="mb-0"
            hint={locale === LOCALES[0] ? hint : undefined}
          >
            {(props) =>
              multiline ? (
                <Textarea
                  {...props}
                  lang={locale}
                  dir={LOCALE_DIRECTION[locale]}
                  rows={4}
                  value={value[locale] ?? ""}
                  onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
                  className="min-h-24"
                />
              ) : (
                <Input
                  {...props}
                  type="text"
                  lang={locale}
                  dir={LOCALE_DIRECTION[locale]}
                  value={value[locale] ?? ""}
                  onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
                />
              )
            }
          </Field>
        );
      })}
      </div>

      {/*
        The default language's text, copied into an empty box.
        Translating usually starts from the original rather than from nothing,
        and retyping a SKU-like title or a product name into the second column
        is the one move a bilingual editor makes over and over. It only appears
        where it would do something: the source has text and the target is empty,
        so it can never quietly overwrite a translation someone wrote.
      */}
      {missing.length > 0 && (value[LOCALES[0]] ?? "").trim() !== "" ? (
        <div className="-mt-2 flex flex-wrap gap-2">
          {missing
            .filter((locale) => locale !== LOCALES[0])
            .map((locale) => (
              <Button
                key={locale}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...value, [locale]: value[LOCALES[0]] ?? "" })}
              >
                {t("i18n.copyFrom", {
                  from: LOCALE_LABELS[LOCALES[0]],
                  to: LOCALE_LABELS[locale],
                })}
              </Button>
            ))}
        </div>
      ) : null}

    </FieldSet>
  );
}
