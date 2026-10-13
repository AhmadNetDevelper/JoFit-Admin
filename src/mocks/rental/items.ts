import type { RentalCategory, RentalItem } from "@/features/rental";
import type { AuditInfo, Location } from "@/types";

import { hashSeed } from "../runtime";
import { storefrontMedia } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";

/**
 * The storefront's hire catalogue, plus the unit count only staff can change.
 *
 * Kept apart from the bookings in `./index.ts` because orders are built from
 * these items and bookings are built from those orders — one file would import
 * itself in a circle.
 */
const audit = (createdAt: string, updatedAt: string): AuditInfo => ({
  createdAt,
  createdBy: "admin-1",
  updatedAt,
  updatedBy: "admin-3",
});

/* Copied rather than shared with the snapshot: staff add, rename and remove
   depots here, and the snapshot is the storefront's record, not ours to edit. */
export const mockRentalLocations: Location[] = websiteSnapshot.rentalLocations.map((location) => ({ ...location }));

function locationById(id: string): Location {
  const location = mockRentalLocations.find((entry) => entry.id === id);
  if (!location) throw new Error(`Rental item points at unknown depot "${id}"`);
  return location;
}

export const mockRentalItems: RentalItem[] = websiteSnapshot.rentalItems.map((item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  summary: item.summary,
  /* The storefront's own photo paths, made absolute so the admin can show them. */
  media: storefrontMedia(item.media),
  status: "published",
  categoryIds: item.categoryIds,
  sportIds: item.sportIds,
  rates: item.rates,
  deposit: item.deposit,
  location: locationById(item.locationId),
  condition: item.condition,
  totalUnits: item.totalUnits,
  /* One unit in roughly a third of the fleet is in the workshop — enough that
     the out-of-service control has something to show, never the whole item. */
  unitsOutOfService: item.totalUnits > 1 && hashSeed(item.id) % 3 === 0 ? 1 : 0,
  rating: item.rating,
  audit: audit(item.publishedAt, item.publishedAt),
}));

/* `itemCount` is recomputed on every read by the service; the value here is
   only what the fixture starts with. */
export const mockRentalCategories: RentalCategory[] = websiteSnapshot.rentalCategories.map(
  (category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    sportIds: category.sportIds,
    itemCount: mockRentalItems.filter((item) => item.categoryIds.includes(category.id)).length,
  }),
);
