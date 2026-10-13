/**
 * The platform is bilingual: English and Arabic, with Arabic written
 * right-to-left. Locale is a first-class concept, not a translation layer bolted
 * on top — it reaches the data layer (see `LocalizedText`) and the document
 * direction, not just visible strings.
 */
export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export type TextDirection = "ltr" | "rtl";

export const LOCALE_DIRECTION: Readonly<Record<Locale, TextDirection>> = {
  en: "ltr",
  ar: "rtl",
};

/** Endonyms: each language is named in itself, never translated. */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ar: "العربية",
};

/**
 * BCP-47 tags handed to `Intl`.
 *
 * Arabic is pinned to `-u-nu-latn` so numbers, dates and prices render with
 * Latin digits (1234), which is what Jordanian commerce uses in practice.
 * Dropping that subtag switches to Arabic-Indic digits (١٢٣٤) — it is a one-line
 * change here if the business prefers them.
 */
export const LOCALE_TAGS: Readonly<Record<Locale, string>> = {
  en: "en-GB",
  ar: "ar-JO-u-nu-latn",
};

export function localeDirection(locale: Locale): TextDirection {
  return LOCALE_DIRECTION[locale];
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
