import type { LocalizedText } from "@/types";

/**
 * STAFF-MANAGED NAVIGATION: the storefront's "Courses" menu and the pages its
 * items open. Order in the arrays IS the display order.
 */

/** Where a menu item goes: one of the managed pages, or any path on the storefront. */
export type MenuTarget =
  | { readonly kind: "page"; readonly pageId: string }
  | { readonly kind: "link"; readonly href: string };

export interface MenuItem {
  readonly id: string;
  readonly label: LocalizedText;
  /** Hidden items stay in the menu for later but are not shown on the site. */
  readonly isVisible: boolean;
  readonly target: MenuTarget;
}

export interface MenuGroup {
  readonly id: string;
  readonly label: LocalizedText;
  readonly items: readonly MenuItem[];
}

export interface Menu {
  readonly key: string;
  readonly label: LocalizedText;
  /** Where the menu's own heading links to on the storefront. */
  readonly href: string;
  readonly groups: readonly MenuGroup[];
  readonly updatedAt: string;
}

/** The editable part of a menu. */
export type MenuDraft = Omit<Menu, "key" | "updatedAt">;

export interface MenuPageSection {
  readonly id: string;
  readonly heading: LocalizedText;
  /** Plain text; a blank line starts a new paragraph. */
  readonly body: LocalizedText;
}

export type MenuPageStatus = "draft" | "published";

/** A page served at `/specialisations/{slug}` on the storefront. */
export interface MenuPage {
  readonly id: string;
  readonly slug: string;
  readonly eyebrow: LocalizedText;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly sections: readonly MenuPageSection[];
  readonly cta?: { readonly label: LocalizedText; readonly href: string };
  readonly status: MenuPageStatus;
  readonly updatedAt: string;
}

export type MenuPageDraft = Omit<MenuPage, "id" | "updatedAt">;

/** The key of the one menu this admin edits today. */
export const COURSES_MENU_KEY = "courses";

/** The storefront path of a managed page, for "view on site" links. */
export function menuPagePath(slug: string): string {
  return `/specialisations/${slug}`;
}
