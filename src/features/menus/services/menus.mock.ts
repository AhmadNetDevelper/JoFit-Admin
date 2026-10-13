import { DEFAULT_LOCALE } from "@/i18n/locales";
import { AppError, localize, notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { mockMenuPages, mockMenus } from "@/mocks/menus";
import { localizedValues, matchesText, simulateLatency, sortRows } from "@/mocks/runtime";
import type { LocalizedText } from "@/types";

import type { Menu, MenuDraft, MenuPage, MenuPageDraft } from "../types";
import type { MenusAdminService } from "./menus.contract";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PAGE_SORT: Readonly<Record<string, (page: MenuPage) => unknown>> = {
  slug: (page) => page.slug,
  status: (page) => page.status,
  updatedAt: (page) => page.updatedAt,
};

const blank = (text: LocalizedText | undefined) => !text?.en?.trim() || !text?.ar?.trim();

/** Every label in both languages, every link a site path, every page target real. */
function validateMenu(draft: MenuDraft): void {
  const errors: Record<string, string> = {};
  if (blank(draft.label)) errors["label.en"] = "The menu needs a name in both languages.";
  if (!draft.href.startsWith("/")) errors.href = "A path on the site, starting with /.";
  draft.groups.forEach((group, g) => {
    if (blank(group.label)) errors[`groups.${g}.label.en`] = "Name this column in both languages.";
    group.items.forEach((item, i) => {
      const at = `groups.${g}.items.${i}`;
      if (blank(item.label)) errors[`${at}.label.en`] = "Label this link in both languages.";
      if (item.target.kind === "link" && !item.target.href.startsWith("/")) {
        errors[`${at}.href`] = "A path on the site, starting with /.";
      }
      if (item.target.kind === "page") {
        const { pageId } = item.target;
        if (!mockMenuPages.some((page) => page.id === pageId)) errors[`${at}.page`] = "Choose one of the pages.";
      }
    });
  });
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function validatePage(draft: MenuPageDraft, id?: string): void {
  const errors: Record<string, string> = {};
  if (!SLUG.test(draft.slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. strength-coaching.";
  else if (mockMenuPages.some((page) => page.slug === draft.slug && page.id !== id)) {
    errors.slug = "Another page already uses this address.";
  }
  (["title", "summary"] as const).forEach((field) => {
    if (!draft[field].en.trim()) errors[`${field}.en`] = "Required.";
    if (!draft[field].ar.trim()) errors[`${field}.ar`] = "Required.";
  });
  draft.sections.forEach((section, index) => {
    if (blank(section.heading)) errors[`sections.${index}.heading.en`] = "Give this section a heading in both languages.";
  });
  if (draft.cta && (blank(draft.cta.label) || !draft.cta.href.trim())) {
    errors["cta.label.en"] = "A button needs a label in both languages and a destination.";
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

export const mockMenusAdminService: MenusAdminService = {
  async getMenu(key) {
    await simulateLatency();
    return mockMenus.find((menu) => menu.key === key) ?? null;
  },

  async saveMenu(key, draft) {
    await simulateLatency();
    validateMenu(draft);
    const menu: Menu = { ...draft, key, updatedAt: nowIso() };
    const index = mockMenus.findIndex((entry) => entry.key === key);
    if (index < 0) mockMenus.push(menu);
    else mockMenus[index] = menu;
    pushToStorefront("menu", key, { ...menu }, "put");
    return menu;
  },

  async listPages() {
    await simulateLatency();
    return [...mockMenuPages].sort((a, b) => a.title.en.localeCompare(b.title.en));
  },

  async listPagesPage(query) {
    await simulateLatency();
    const locale = query.locale ?? DEFAULT_LOCALE;
    const rows = mockMenuPages.filter((page) => matchesText([...localizedValues(page.title), page.slug], query.search));
    /* By title in the language it is read in, unless another field is asked for. */
    const select = (query.sort && PAGE_SORT[query.sort.field]) ?? ((page: MenuPage) => localize(page.title, locale));
    return paginate(sortRows(rows, select, query.sort?.direction ?? "asc"), query);
  },

  async getPage(id) {
    await simulateLatency();
    return mockMenuPages.find((page) => page.id === id) ?? null;
  },

  async createPage(draft) {
    await simulateLatency();
    validatePage(draft);
    const page: MenuPage = { ...draft, id: `page-${crypto.randomUUID().slice(0, 8)}`, updatedAt: nowIso() };
    mockMenuPages.push(page);
    pushToStorefront("menu-page", page.id, { ...page }, "put");
    return page;
  },

  async updatePage(id, draft) {
    await simulateLatency();
    const index = mockMenuPages.findIndex((page) => page.id === id);
    if (index < 0) throw notFound(`Page "${id}"`);
    validatePage(draft, id);
    const page: MenuPage = { ...draft, id, updatedAt: nowIso() };
    mockMenuPages[index] = page;
    pushToStorefront("menu-page", id, { ...page }, "put");
    return page;
  },

  async deletePage(id) {
    await simulateLatency();
    const usedBy = mockMenus.some((menu) =>
      menu.groups.some((group) => group.items.some((item) => item.target.kind === "page" && item.target.pageId === id)),
    );
    if (usedBy) {
      throw new AppError("conflict", "A menu item still opens this page. Remove or re-point it first.", { status: 409 });
    }
    const index = mockMenuPages.findIndex((page) => page.id === id);
    if (index < 0) throw notFound(`Page "${id}"`);
    mockMenuPages.splice(index, 1);
    pushToStorefront("menu-page", id, {}, "delete");
  },
};
