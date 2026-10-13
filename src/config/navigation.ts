import type { TranslationKey } from "@/i18n/dictionaries";
import type { Permission } from "@/types";

import type { FeatureKey } from "./features";

export type NavIconKey =
  | "dashboard"
  | "package"
  | "tags"
  | "bookmark"
  | "receipt"
  | "users"
  | "box"
  | "calendar"
  | "calendarCheck"
  | "clipboard"
  | "warehouse"
  | "whistle"
  | "graduation"
  | "article"
  | "star"
  | "chat"
  | "quote"
  | "activity"
  | "settings"
  | "menu"
  | "headset"
  | "briefcase"
  | "building"
  | "fileUser"
  | "list"
  | "userCog"
  | "shield";

export interface NavItem {
  /** Dictionary key, not a literal — the sidebar is bilingual. */
  readonly labelKey: TranslationKey;
  readonly to: string;
  /**
   * Which icon the sidebar draws beside the label, never instead of it. An icon
   * speeds up finding a screen you already know; the word is what makes it
   * findable the first time, and what keeps the sidebar readable in both
   * languages.
   *
   * A key, not a component: config describes the navigation and must not import
   * from `components/` — the linter enforces that direction. `AdminSidebar`
   * resolves the key against its own icon map.
   */
  readonly icon: NavIconKey;
  /** Hidden unless the signed-in user holds this permission. */
  readonly permission: Permission;
  /** Hidden while the feature flag is off. */
  readonly feature: FeatureKey;
}

export interface NavGroup {
  /** Suffix of a `nav.group.*` dictionary key. */
  readonly label: "commerce" | "rental" | "people" | "content" | "careers" | "business";
  readonly items: readonly NavItem[];
}

/**
 * Navigation is data, not markup. Adding an admin screen is an entry here, a
 * route, and one translation pair — the sidebar component never changes.
 */
export const adminNav: readonly NavGroup[] = [
  {
    label: "commerce",
    items: [
      { labelKey: "nav.products", to: "/catalogue/products", icon: "package", permission: "catalogue:read", feature: "catalogue" },
      { labelKey: "nav.categories", to: "/catalogue/categories", icon: "tags", permission: "catalogue:read", feature: "catalogue" },
      { labelKey: "nav.brands", to: "/catalogue/brands", icon: "bookmark", permission: "catalogue:read", feature: "catalogue" },
      { labelKey: "nav.orders", to: "/orders", icon: "receipt", permission: "orders:read", feature: "orders" },
      { labelKey: "nav.customers", to: "/customers", icon: "users", permission: "customers:read", feature: "customers" },
    ],
  },
  {
    label: "rental",
    items: [
      { labelKey: "nav.rentalItems", to: "/rental/items", icon: "box", permission: "rental:read", feature: "rental" },
      { labelKey: "nav.bookings", to: "/rental/bookings", icon: "calendar", permission: "rental:read", feature: "rental" },
      { labelKey: "nav.rentalSetup", to: "/rental/setup", icon: "warehouse", permission: "rental:read", feature: "rental" },
    ],
  },
  {
    label: "people",
    items: [
      { labelKey: "nav.coaches", to: "/coaches", icon: "whistle", permission: "coaches:read", feature: "coaches" },
      { labelKey: "nav.coachBookings", to: "/coaches/bookings", icon: "calendarCheck", permission: "coaches:read", feature: "coaches" },
      { labelKey: "nav.specialisations", to: "/coaches/specialisations", icon: "bookmark", permission: "coaches:read", feature: "coaches" },
      { labelKey: "nav.courses", to: "/education/courses", icon: "graduation", permission: "education:read", feature: "education" },
      { labelKey: "nav.enrolments", to: "/education/enrolments", icon: "clipboard", permission: "education:read", feature: "education" },
      { labelKey: "nav.courseCategories", to: "/education/categories", icon: "tags", permission: "education:read", feature: "education" },
    ],
  },
  {
    label: "content",
    items: [
      { labelKey: "nav.articles", to: "/content/articles", icon: "article", permission: "content:read", feature: "content" },
      { labelKey: "nav.articleCategories", to: "/content/categories", icon: "tags", permission: "content:read", feature: "content" },
      { labelKey: "nav.authors", to: "/content/authors", icon: "users", permission: "content:read", feature: "content" },
      { labelKey: "nav.coursesMenu", to: "/content/menu", icon: "menu", permission: "content:read", feature: "menus" },
      { labelKey: "nav.reviews", to: "/reviews", icon: "star", permission: "reviews:read", feature: "reviews" },
      { labelKey: "nav.community", to: "/community", icon: "chat", permission: "community:moderate", feature: "community" },
    ],
  },
  {
    /* The job marketplace: badges count employers to verify and jobs to review. */
    label: "careers",
    items: [
      { labelKey: "nav.careersJobs", to: "/careers/jobs", icon: "briefcase", permission: "careers:read", feature: "careers" },
      { labelKey: "nav.careersEmployers", to: "/careers/employers", icon: "building", permission: "careers:read", feature: "careers" },
      { labelKey: "nav.careersApplications", to: "/careers/applications", icon: "fileUser", permission: "careers:read", feature: "careers" },
      { labelKey: "nav.careersCategories", to: "/careers/categories", icon: "tags", permission: "careers:read", feature: "careers" },
    ],
  },
  {
    label: "business",
    items: [
      { labelKey: "nav.quotations", to: "/quotations", icon: "quote", permission: "quotations:read", feature: "quotations" },
      { labelKey: "nav.support", to: "/support", icon: "headset", permission: "support:reply", feature: "support" },
      { labelKey: "nav.sports", to: "/sports", icon: "activity", permission: "sports:write", feature: "sports" },
      { labelKey: "nav.lookups", to: "/lookups", icon: "list", permission: "lookups:write", feature: "lookups" },
      { labelKey: "nav.users", to: "/access/users", icon: "userCog", permission: "users:write", feature: "identity" },
      { labelKey: "nav.roles", to: "/access/roles", icon: "shield", permission: "users:write", feature: "identity" },
      { labelKey: "nav.team", to: "/team", icon: "users", permission: "settings:write", feature: "settings" },
      { labelKey: "nav.settings", to: "/settings", icon: "settings", permission: "settings:write", feature: "settings" },
    ],
  },
];
