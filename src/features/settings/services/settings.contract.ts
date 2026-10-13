import type { StorefrontTheme, ThemeDraft } from "../types";

export interface SettingsService {
  getTheme(): Promise<StorefrontTheme>;
  /** Validates colours and contrast; returns field errors keyed `colors.primary`. */
  updateTheme(draft: ThemeDraft): Promise<StorefrontTheme>;
  /** Back to the theme the storefront ships with. */
  resetTheme(): Promise<StorefrontTheme>;
}
