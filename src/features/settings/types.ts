import type { AuditInfo } from "@/types";

/**
 * THE STOREFRONT THEME, AS STAFF EDIT IT.
 *
 * Field for field the storefront's own theme contract
 * (`website/src/features/theme/types.ts`), which says of itself that "a future
 * admin screen can offer a colour picker without the site needing to learn a
 * new format" — this is that screen. Every value is a raw CSS value because the
 * site writes them straight into custom properties on `<html>`; anything legal
 * in CSS is legal here, and the service rejects what would break the page.
 *
 * What is NOT here is deliberate: a value outside this object is a design
 * decision and lives in the storefront's CSS, not a setting.
 *
 * OPEN BUSINESS DECISIONS: whether a theme change goes live on save or needs a
 * preview and an approval, and whether themes are versioned so a bad change can
 * be rolled back. The mock applies nothing to the storefront — there is no
 * backend for the site to read the saved theme from yet.
 */
export interface ThemeColors {
  readonly primary: string;
  readonly primaryHover: string;
  readonly primaryDark: string;
  readonly accent: string;
  readonly secondary: string;
  readonly onPrimary: string;
  readonly onSecondary: string;
  readonly title: string;
  readonly body: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly border: string;
}

/**
 * The live theme schema (`StorefrontThemeDto`, see docs/api-live/admin.json)
 * is missing most of these dials: `ThemeTypography` only has `fontFamily`+
 * `scale`, `ThemeShape` only `skew`, `ThemeLayout` only `headerMode`.
 * `titleWeight`/`radius`/`buttonRadius`/`maxWidth`/`sectionSpacing` have NO
 * backend field at all — saving them from the admin editor currently has
 * nowhere to go server-side. Made optional here rather than dropped outright
 * so the editor can keep offering them against the shipped defaults
 * (`httpSettingsService` merges a live partial response over `defaultTheme`);
 * this is the biggest capability gap in this domain, worth raising with the
 * backend team before relying on it.
 */
export interface ThemeTypography {
  /** Must name its families literally, Arabic face before any Latin fallback. */
  readonly fontFamily: string;
  readonly scale: string;
  readonly titleWeight?: string;
}

export interface ThemeShape {
  /** The template's sheared signature. `0deg` squares the whole site. */
  readonly skew: string;
  readonly radius?: string;
  readonly buttonRadius?: string;
}

export interface ThemeLayout {
  readonly maxWidth?: string;
  readonly sectionSpacing?: string;
  readonly headerMode: "fixed" | "static";
}

export interface StorefrontTheme {
  readonly id: string;
  readonly name: string;
  readonly colors: ThemeColors;
  readonly typography: ThemeTypography;
  readonly shape: ThemeShape;
  readonly layout: ThemeLayout;
  readonly audit: AuditInfo;
}

/** The editable part — never the audit. */
export type ThemeDraft = Omit<StorefrontTheme, "id" | "audit">;

export const THEME_COLOR_KEYS = [
  "primary",
  "primaryHover",
  "primaryDark",
  "accent",
  "secondary",
  "onPrimary",
  "onSecondary",
  "title",
  "body",
  "surface",
  "surfaceMuted",
  "border",
] as const satisfies readonly (keyof ThemeColors)[];
