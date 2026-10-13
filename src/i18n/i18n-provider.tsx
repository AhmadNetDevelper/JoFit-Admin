import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { dictionaries, type TranslationKey } from "./dictionaries";
import { I18nContext, type I18nContextValue } from "./i18n-context";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, LOCALE_TAGS, isLocale, type Locale } from "./locales";

const STORAGE_KEY = "jofit.admin.locale";

/**
 * Reads the staff member's language preference, falling back to the browser's.
 * Storage can be unavailable (private mode, blocked site data), so every access
 * is guarded and the app still works without it.
 */
function readInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Ignore: a stored preference is a convenience, not a requirement.
  }
  const browser = navigator.language.split("-")[0];
  return isLocale(browser) ? browser : DEFAULT_LOCALE;
}

function interpolate(
  template: string,
  values?: Readonly<Record<string, string | number>>,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Language is application state: one small provider, no i18n library.
 *
 * A library earns its place when you need plurals with language-specific rules,
 * lazy-loaded namespaces or ICU message syntax. Until then this is ~60 lines
 * with full type safety, and `useTranslation()` is the seam to swap behind.
 *
 * NOTE ON ARABIC PLURALS: Arabic has six plural forms. The moment a string needs
 * real pluralisation, reach for `Intl.PluralRules` — or adopt a library — rather
 * than adding `_one`/`_other` keys by hand.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const direction = LOCALE_DIRECTION[locale];

  // The document element carries lang and dir so the browser applies the right
  // text direction, hyphenation and font fallbacks to the whole page.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore.
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];
    return {
      locale,
      direction,
      localeTag: LOCALE_TAGS[locale],
      setLocale,
      t: (key: TranslationKey, values?: Readonly<Record<string, string | number>>) =>
        interpolate(dictionary[key], values),
    };
  }, [locale, direction, setLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
