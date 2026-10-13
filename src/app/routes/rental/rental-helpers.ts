import type { RentalCategory } from "@/features/rental";

import { recordPath } from "../../record-paths";

/**
 * Helpers the rental editors share: where an item lives, the slug suggestion,
 * and the category tree both the setup screen and the item page list.
 */

/** A rental item's own page. (`recordPath.rentalItemBookings` is its bookings.) */
export const rentalItemPath = (id: string) => recordPath.rentalItem(id);

/** A slug suggested from an English name, as `ReferenceEditor` suggests one. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export interface CategoryNode {
  readonly category: RentalCategory;
  readonly depth: number;
}

/**
 * Categories in reading order: each top-level one followed by its
 * sub-categories, however deep. Anything whose parent is missing still shows,
 * at the top level, so a broken link in the data never hides a record.
 */
export function categoryTree(categories: readonly RentalCategory[]): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const category of categories.filter((entry) => entry.parentId === parentId)) {
      nodes.push({ category, depth });
      visit(category.id, depth + 1);
    }
  };
  visit(null, 0);
  for (const category of categories) {
    if (!nodes.some((node) => node.category.id === category.id)) nodes.push({ category, depth: 0 });
  }
  return nodes;
}

/** The ids of a category and everything beneath it — none of them can become its parent. */
export function selfAndDescendants(categories: readonly RentalCategory[], id: string): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}
