/**
 * What a member of staff may change about the shell, and nothing else.
 *
 * Each of these is a real preference — it survives a reload and follows the
 * person, not the screen. Anything that is a momentary adjustment rather than a
 * preference stays as local state in the component that owns it.
 *
 * The list is deliberately shorter than the upstream template's. It leaves out
 * the theme presets and the font picker, because this admin ships one palette
 * and one pair of faces: a control that offers eight fonts when seven of them
 * have no Arabic would be a control that breaks half the product.
 */
export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** How the sidebar sits against the page. */
export const SIDEBAR_VARIANTS = ["sidebar", "floating", "inset"] as const;
export type SidebarVariant = (typeof SIDEBAR_VARIANTS)[number];

/** What collapsing it does: shrink to icons, or slide away entirely. */
export const SIDEBAR_COLLAPSIBLES = ["icon", "offcanvas"] as const;
export type SidebarCollapsible = (typeof SIDEBAR_COLLAPSIBLES)[number];

/** Whether a screen fills the window or is held to a readable measure. */
export const CONTENT_LAYOUTS = ["full", "centered"] as const;
export type ContentLayout = (typeof CONTENT_LAYOUTS)[number];

export interface Preferences {
  readonly themeMode: ThemeMode;
  readonly sidebarVariant: SidebarVariant;
  readonly sidebarCollapsible: SidebarCollapsible;
  readonly contentLayout: ContentLayout;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: "light",
  sidebarVariant: "sidebar",
  sidebarCollapsible: "icon",
  contentLayout: "full",
};

const STORAGE_KEY = "jofit-admin-preferences";

const GUARDS: { [K in keyof Preferences]: readonly Preferences[K][] } = {
  themeMode: THEME_MODES,
  sidebarVariant: SIDEBAR_VARIANTS,
  sidebarCollapsible: SIDEBAR_COLLAPSIBLES,
  contentLayout: CONTENT_LAYOUTS,
};

/**
 * Reads what was stored, keeping only values still in the allowed set.
 *
 * A value that has been removed from the product since it was stored falls back
 * to the default rather than being written to the DOM, so a stale preference
 * cannot put the shell into a state the CSS no longer describes.
 */
export function readPreferences(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const stored = JSON.parse(raw) as Partial<Record<keyof Preferences, unknown>>;
    const result = { ...DEFAULT_PREFERENCES };

    for (const key of Object.keys(GUARDS) as (keyof Preferences)[]) {
      const value = stored[key];
      if ((GUARDS[key] as readonly unknown[]).includes(value)) {
        Object.assign(result, { [key]: value });
      }
    }
    return result;
  } catch {
    /* Private mode, disabled storage, or malformed JSON: the defaults hold. */
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* Not being able to remember a choice must not break making it. */
  }
}

/** `system` resolves against the OS; the other two are answers in themselves. */
export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}
