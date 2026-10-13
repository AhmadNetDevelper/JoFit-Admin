import { nowIso, validationFailed } from "@/lib";
import { defaultTheme, mockTheme, setMockTheme } from "@/mocks/settings";
import { simulateLatency } from "@/mocks/runtime";

import { THEME_COLOR_KEYS, type StorefrontTheme, type ThemeDraft } from "../types";
import { contrastRatio, parseHexColor } from "../utils/contrast";
import type { SettingsService } from "./settings.contract";

/** WCAG AA for body text — the bar the storefront's own tokens are held to. */
const MIN_CONTRAST = 4.5;

/**
 * Server-side validation, simulated. The storefront writes these values
 * straight into CSS, so a typo here is a broken public page — which is why the
 * checks are strict and live in the service, not the form.
 */
function validate(draft: ThemeDraft): void {
  const errors: Record<string, string> = {};

  for (const key of THEME_COLOR_KEYS) {
    if (!parseHexColor(draft.colors[key])) {
      errors[`colors.${key}`] = "Use a hex colour, for example #008050.";
    }
  }

  const pairs = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["body", "surface"],
    ["title", "surface"],
  ] as const;
  for (const [text, background] of pairs) {
    const ratio = contrastRatio(draft.colors[text], draft.colors[background]);
    if (ratio !== undefined && ratio < MIN_CONTRAST) {
      errors[`colors.${text}`] =
        `Contrast against ${background} is ${ratio.toFixed(2)}:1; it must be at least ${MIN_CONTRAST}:1.`;
    }
  }

  if (!/^-?\d+(\.\d+)?deg$/.test(draft.shape.skew.trim())) {
    errors["shape.skew"] = "Use degrees, for example -15deg or 0deg.";
  }
  if (!/^\d+(\.\d+)?$/.test(draft.typography.scale.trim()) || Number(draft.typography.scale) <= 0) {
    errors["typography.scale"] = "Use a positive number, for example 1 or 1.1.";
  }
  if (!/tajawal|cairo|noto (sans|kufi) arabic|ibm plex sans arabic/i.test(draft.typography.fontFamily)) {
    errors["typography.fontFamily"] =
      "Name an Arabic family before any Latin fallback, or Arabic text renders in the system font.";
  }

  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

export const mockSettingsService: SettingsService = {
  async getTheme() {
    await simulateLatency();
    return mockTheme();
  },

  async updateTheme(draft) {
    await simulateLatency();
    validate(draft);
    const updated: StorefrontTheme = {
      ...mockTheme(),
      ...draft,
      audit: { ...mockTheme().audit, updatedAt: nowIso(), updatedBy: "admin-1" },
    };
    setMockTheme(updated);
    return updated;
  },

  async resetTheme() {
    await simulateLatency();
    const reset: StorefrontTheme = {
      ...defaultTheme,
      audit: { ...defaultTheme.audit, updatedAt: nowIso(), updatedBy: "admin-1" },
    };
    setMockTheme(reset);
    return reset;
  },
};
