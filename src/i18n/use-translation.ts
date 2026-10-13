import { useContext } from "react";

import { I18nContext, type I18nContextValue } from "./i18n-context";

/**
 * The i18n public API. Components depend on this hook, never on the context or
 * the dictionaries, so the implementation can be replaced without touching them.
 */
export function useTranslation(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useTranslation must be used inside <I18nProvider>.");
  }
  return value;
}
