import type { StorefrontTheme } from "./types";

/**
 * The storefront's shipped theme (`website/src/features/theme/default-theme.json`).
 * "Reset" returns to this; the live HTTP adapter also merges onto it, since the
 * live theme schema only covers a few of these fields (see `ThemeTypography`'s
 * own doc comment in `./types`).
 *
 * Lives outside `@/mocks` on purpose: a `.http.ts` adapter may not import mock
 * data (`no-restricted-imports`), and this value is a real production fallback,
 * not a fixture. `@/mocks/settings` re-exports this same constant rather than
 * deriving its own copy, so there is exactly one place these numbers live.
 */
export const defaultTheme: StorefrontTheme = {
  id: "jofit-green",
  name: "JoFit Green",
  colors: {
    primary: "#008050",
    primaryHover: "#00693f",
    primaryDark: "#005030",
    accent: "#d4b36a",
    secondary: "#232323",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    title: "#222222",
    body: "#575757",
    surface: "#ffffff",
    surfaceMuted: "#f6f7f5",
    border: "#e9e9e9",
  },
  typography: {
    fontFamily: "Poppins, Tajawal, system-ui, sans-serif",
    scale: "1",
    titleWeight: "700",
  },
  shape: {
    skew: "-15deg",
    radius: "0px",
    buttonRadius: "0px",
  },
  layout: {
    maxWidth: "1200px",
    sectionSpacing: "6.25rem",
    headerMode: "fixed",
  },
  audit: { createdAt: "2026-01-04", createdBy: "system", updatedAt: "2026-01-04", updatedBy: "system" },
};
