import type { ListQuery, Paginated } from "@/types";

import type { Menu, MenuDraft, MenuPage, MenuPageDraft } from "../types";

export interface MenusAdminService {
  getMenu(key: string): Promise<Menu | null>;
  /** Replaces the whole menu: groups, items and their order. */
  saveMenu(key: string, draft: MenuDraft): Promise<Menu>;
  /** Every page, by English title — for the menu items' page picker. */
  listPages(): Promise<readonly MenuPage[]>;
  /** One page of pages for the side list; `search` matches either title or the slug. */
  listPagesPage(query: ListQuery): Promise<Paginated<MenuPage>>;
  getPage(id: string): Promise<MenuPage | null>;
  createPage(draft: MenuPageDraft): Promise<MenuPage>;
  updatePage(id: string, draft: MenuPageDraft): Promise<MenuPage>;
  /** Refused (409) while a menu item still points at the page. */
  deletePage(id: string): Promise<void>;
}
