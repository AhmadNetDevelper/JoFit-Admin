import { LOCALES, LOCALE_LABELS } from "@/i18n";

/** A suggested address from an English name: "Layla Haddad" → "layla-haddad". */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Error-summary labels for a localized field, named the way the form names its
 * boxes: "Name — English", "Name — العربية".
 */
export function bothLanguages(key: string, label: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((locale) => [`${key}.${locale}`, `${label} — ${LOCALE_LABELS[locale]}`]));
}

/**
 * Typed text to a number. Blank is NaN, not 0 — an empty "years of experience"
 * must be reported as missing, not saved as none.
 */
export const toNumber = (typed: string) => (typed.trim() === "" ? Number.NaN : Number(typed));
