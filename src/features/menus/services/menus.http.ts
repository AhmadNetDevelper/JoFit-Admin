import { adminListParams, httpClient, orNull } from "@/services";
import type { LocalizedText, Paginated } from "@/types";

import type { Menu, MenuDraft, MenuGroup, MenuItem, MenuPage, MenuPageDraft, MenuPageSection, MenuTarget } from "../types";
import type { MenusAdminService } from "./menus.contract";

const enc = encodeURIComponent;

/* ------------------------------------------------------------------------
 * Wire DTOs — `docs/api-live/admin.json`, tags AdminMenus / AdminMenuPages.
 * Two structural mismatches, not just renames:
 *  - `updatedAt` is flat on the admin's `Menu`/`MenuPage`; live only has a
 *    nested `audit: AuditDto`.
 *  - `MenuTarget` is a discriminated union (`{kind:"page",pageId}` xor
 *    `{kind:"link",href}`) on the admin side; live's `MenuTargetDoc`/
 *    `MenuTargetRequest` is a flat object that always carries both `pageId`
 *    and `href` (nullable) — `toMenuTarget`/`fromMenuTarget` convert.
 * `PageSectionDto` also has no `id` at all; one is generated on read since
 * `MenuPageSection.id` only needs to be stable within one editing session
 * (React keys / drag-reorder state), not across saves.
 * ------------------------------------------------------------------------ */

interface AuditDto {
  readonly createdAt: string;
  readonly createdBy: number | null;
  readonly updatedAt: string | null;
  readonly updatedBy: number | null;
}

interface PagedResultDto<TDto> {
  readonly items: readonly TDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

interface MenuTargetDto {
  readonly kind: string;
  readonly pageId: number | null;
  readonly href: string | null;
}

interface MenuItemDto {
  readonly id: string;
  readonly label: LocalizedText;
  readonly isVisible: boolean;
  readonly target: MenuTargetDto;
}

interface MenuGroupDto {
  readonly id: string;
  readonly label: LocalizedText;
  readonly items: readonly MenuItemDto[];
}

interface AdminMenuDto {
  readonly key: string;
  readonly label: LocalizedText;
  readonly href: string | null;
  readonly groups: readonly MenuGroupDto[];
  readonly audit: AuditDto;
}

interface PageSectionDto {
  readonly heading: LocalizedText;
  readonly body: LocalizedText;
}

interface PageCtaDto {
  readonly label: LocalizedText;
  readonly href: string;
}

interface AdminMenuPageDto {
  readonly id: number;
  readonly slug: string;
  readonly eyebrow: LocalizedText | null;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly sections: readonly PageSectionDto[];
  readonly cta: PageCtaDto | null;
  readonly status: string;
  readonly audit: AuditDto;
}

function toPaginated<TDto, TDomain>(page: PagedResultDto<TDto>, mapItem: (item: TDto) => TDomain): Paginated<TDomain> {
  return {
    items: page.items.map(mapItem),
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalCount,
      totalPages: page.totalPages,
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
    },
  };
}

/** Live always sends both `pageId`/`href` (nullable); whichever is non-null decides the union's branch. */
function toMenuTarget(dto: MenuTargetDto): MenuTarget {
  if (dto.pageId != null) return { kind: "page", pageId: String(dto.pageId) };
  if (dto.href != null) return { kind: "link", href: dto.href };
  // Both null is a malformed row — degrade to an empty link rather than throw.
  return { kind: "link", href: "" };
}

function fromMenuTarget(target: MenuTarget): MenuTargetDto {
  return {
    kind: target.kind,
    pageId: target.kind === "page" ? Number(target.pageId) : null,
    href: target.kind === "link" ? target.href : null,
  };
}

function toMenuItem(dto: MenuItemDto): MenuItem {
  return { id: dto.id, label: dto.label, isVisible: dto.isVisible, target: toMenuTarget(dto.target) };
}

function fromMenuItem(item: MenuItem) {
  return { id: item.id, label: item.label, isVisible: item.isVisible, target: fromMenuTarget(item.target) };
}

function toMenuGroup(dto: MenuGroupDto): MenuGroup {
  return { id: dto.id, label: dto.label, items: dto.items.map(toMenuItem) };
}

function fromMenuGroup(group: MenuGroup) {
  return { id: group.id, label: group.label, items: group.items.map(fromMenuItem) };
}

function toMenu(dto: AdminMenuDto): Menu {
  return {
    key: dto.key,
    label: dto.label,
    // Live `href` is nullable; the admin type wants a plain string.
    href: dto.href ?? "",
    groups: dto.groups.map(toMenuGroup),
    // Live has no top-level `updatedAt` at all — only the nested `audit.updatedAt` (itself nullable).
    updatedAt: dto.audit.updatedAt ?? dto.audit.createdAt,
  };
}

function fromMenuDraft(draft: MenuDraft) {
  return { label: draft.label, href: draft.href, groups: draft.groups.map(fromMenuGroup) };
}

/** `PageSectionDto` has no `id` live — an index-based one is generated, stable for one editing session. */
function toMenuPageSection(dto: PageSectionDto, index: number): MenuPageSection {
  return { id: `section-${index}`, heading: dto.heading, body: dto.body };
}

function fromMenuPageSection(section: MenuPageSection) {
  return { heading: section.heading, body: section.body };
}

function toMenuPage(dto: AdminMenuPageDto): MenuPage {
  return {
    id: String(dto.id),
    slug: dto.slug,
    // Live `eyebrow` is nullable; the admin type wants it filled in both languages.
    eyebrow: dto.eyebrow ?? { en: "", ar: "" },
    title: dto.title,
    summary: dto.summary,
    sections: dto.sections.map(toMenuPageSection),
    ...(dto.cta ? { cta: dto.cta } : {}),
    status: dto.status as MenuPage["status"],
    updatedAt: dto.audit.updatedAt ?? dto.audit.createdAt,
  };
}

function fromMenuPageDraft(draft: MenuPageDraft) {
  return {
    slug: draft.slug,
    eyebrow: draft.eyebrow,
    title: draft.title,
    summary: draft.summary,
    sections: draft.sections.map(fromMenuPageSection),
    ...(draft.cta ? { cta: draft.cta } : {}),
    status: draft.status,
  };
}

/**
 * Staff-managed menus over `/v1/admin/menus/{key}` and `/v1/admin/menu-pages`.
 * The pages list reads one page (`Paginated`); the menu items' page picker
 * reads them all from `/v1/admin/menu-pages/options`.
 */
export const httpMenusAdminService: MenusAdminService = {
  getMenu: async (key) => {
    const dto = await orNull(httpClient.get<AdminMenuDto>(`/v1/admin/menus/${enc(key)}`, { auth: true }));
    return dto ? toMenu(dto) : null;
  },
  saveMenu: async (key, draft) =>
    toMenu(await httpClient.put<AdminMenuDto>(`/v1/admin/menus/${enc(key)}`, fromMenuDraft(draft), { auth: true })),
  listPages: async () => {
    const dtos = await httpClient.get<AdminMenuPageDto[]>("/v1/admin/menu-pages/options", { auth: true });
    return dtos.map(toMenuPage);
  },
  listPagesPage: (query) =>
    httpClient
      .get<PagedResultDto<AdminMenuPageDto>>("/v1/admin/menu-pages", { query: adminListParams(query), auth: true })
      .then((page) => toPaginated(page, toMenuPage)),
  getPage: async (id) => {
    const dto = await orNull(httpClient.get<AdminMenuPageDto>(`/v1/admin/menu-pages/${enc(id)}`, { auth: true }));
    return dto ? toMenuPage(dto) : null;
  },
  createPage: async (draft) =>
    toMenuPage(
      await httpClient.post<AdminMenuPageDto>("/v1/admin/menu-pages", fromMenuPageDraft(draft), { auth: true }),
    ),
  updatePage: async (id, draft) =>
    toMenuPage(
      await httpClient.put<AdminMenuPageDto>(`/v1/admin/menu-pages/${enc(id)}`, fromMenuPageDraft(draft), {
        auth: true,
      }),
    ),
  deletePage: async (id) => {
    await httpClient.delete<void>(`/v1/admin/menu-pages/${enc(id)}`, { auth: true });
  },
};
