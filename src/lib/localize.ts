import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import type { LocalizedText, PartialLocalizedText } from "@/types";

/**
 * Resolves a localized field for display.
 *
 * Falls back to the default locale, then to any non-empty value, so a screen
 * never renders an empty cell just because one translation is missing. The admin
 * shows *which* fields are missing through `missingLocales`, rather than hiding
 * the gap.
 */
export function localize(
  text: LocalizedText | PartialLocalizedText,
  locale: Locale,
): string {
  const exact = text[locale];
  if (exact && exact.trim() !== "") return exact;

  const fallback = text[DEFAULT_LOCALE];
  if (fallback && fallback.trim() !== "") return fallback;

  return Object.values(text).find((value) => value && value.trim() !== "") ?? "";
}

/** Locales with no content yet — used to flag incomplete translations to staff. */
export function missingLocales(
  text: PartialLocalizedText,
  locales: readonly Locale[],
): readonly Locale[] {
  return locales.filter((locale) => !text[locale] || text[locale]?.trim() === "");
}

export function emptyLocalizedText(locales: readonly Locale[]): Record<Locale, string> {
  return Object.fromEntries(locales.map((locale) => [locale, ""])) as Record<Locale, string>;
}
