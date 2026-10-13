import { httpClient } from "@/services";
import type { AuditInfo } from "@/types";

import { defaultTheme } from "../default-theme";

import { THEME_COLOR_KEYS, type StorefrontTheme, type ThemeColors, type ThemeDraft, type ThemeLayout } from "../types";
import type { SettingsService } from "./settings.contract";

/* ---- live DTO shapes (docs/api-live/admin.json) ---------------------------- */

/** `AuditDto2` — nullable as a whole; staff ids are int64. */
interface AuditDto {
  readonly createdAt: string;
  readonly createdBy: number | null;
  readonly updatedAt: string | null;
  readonly updatedBy: number | null;
}

/** `StorefrontThemeDto` — `colors` is an open string map, `headerMode` a free string. */
interface StorefrontThemeDto {
  readonly id: string;
  readonly name: string;
  readonly colors: Readonly<Record<string, string>>;
  readonly typography: { readonly fontFamily: string; readonly scale: string };
  readonly shape: { readonly skew: string };
  readonly layout: { readonly headerMode: string };
  readonly audit: AuditDto | null;
}

function toAudit(dto: AuditDto): AuditInfo {
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

const toHeaderMode = (wire: string): ThemeLayout["headerMode"] =>
  wire === "fixed" || wire === "static" ? wire : defaultTheme.layout.headerMode;

/**
 * Live `StorefrontThemeDto` only models `typography.{fontFamily,scale}`,
 * `shape.skew` and `layout.headerMode` — none of `titleWeight`/`radius`/
 * `buttonRadius`/`maxWidth`/`sectionSpacing` exist server-side at all. This is
 * the biggest capability gap in this domain: the style-kit's own dials have
 * almost no backend to save to. Those five, and any colour the map lacks, come
 * from the shipped defaults (`../default-theme`, the same starting point the
 * storefront ships with) so the editor still has a complete theme to show. A
 * theme with no audit has never been saved, so it is the shipped one's.
 */
function toTheme(dto: StorefrontThemeDto): StorefrontTheme {
  const colors = THEME_COLOR_KEYS.reduce<ThemeColors>(
    (merged, key) => ({ ...merged, [key]: dto.colors[key] ?? merged[key] }),
    defaultTheme.colors,
  );
  return {
    id: dto.id,
    name: dto.name,
    colors,
    typography: { ...defaultTheme.typography, fontFamily: dto.typography.fontFamily, scale: dto.typography.scale },
    shape: { ...defaultTheme.shape, skew: dto.shape.skew },
    layout: { ...defaultTheme.layout, headerMode: toHeaderMode(dto.layout.headerMode) },
    audit: dto.audit ? toAudit(dto.audit) : defaultTheme.audit,
  };
}

/** `ThemeDraftRequest` — only the fields the API stores; the rest have nowhere to go. */
const themeBody = (draft: ThemeDraft) => ({
  name: draft.name,
  colors: Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, draft.colors[key]])),
  typography: { fontFamily: draft.typography.fontFamily, scale: draft.typography.scale },
  shape: { skew: draft.shape.skew },
  layout: { headerMode: draft.layout.headerMode },
});

/** The storefront theme over `/v1/admin/settings/theme`; the storefront reads the saved one from `GET /v1/theme`. */
export const httpSettingsService: SettingsService = {
  getTheme: async () => toTheme(await httpClient.get<StorefrontThemeDto>("/v1/admin/settings/theme", { auth: true })),
  updateTheme: async (draft: ThemeDraft) =>
    toTheme(await httpClient.put<StorefrontThemeDto>("/v1/admin/settings/theme", themeBody(draft), { auth: true })),
  resetTheme: async () =>
    toTheme(await httpClient.post<StorefrontThemeDto>("/v1/admin/settings/theme/reset", undefined, { auth: true })),
};
