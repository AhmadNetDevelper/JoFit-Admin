import { createContext } from "react";

import type { Locale, TextDirection } from "./locales";
import type { TranslationKey } from "./dictionaries";

export interface I18nContextValue {
  readonly locale: Locale;
  readonly direction: TextDirection;
  /** BCP-47 tag for `Intl`. */
  readonly localeTag: string;
  setLocale: (locale: Locale) => void;
  /**
   * Translates a key. `values` interpolates `{name}` placeholders, which keeps
   * sentences whole in each language instead of concatenating fragments — word
   * order differs between English and Arabic, so fragments cannot be reordered.
   */
  t: (key: TranslationKey, values?: Readonly<Record<string, string | number>>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
