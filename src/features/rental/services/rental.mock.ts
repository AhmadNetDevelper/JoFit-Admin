import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { AppError, galleryProblem, localize, notFound, nowIso, paginate, storedGallery, validationFailed } from "@/lib";
import {
  mockRentalBookings,
  mockRentalCategories,
  mockRentalItems,
  mockRentalLocations,
} from "@/mocks/rental";
import { pushCatalogueImages, pushToStorefront } from "@/mocks/bridge";
import { localizedValues, matchesText, nextId, simulateLatency, sortRows } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { LocalizedText, Location, Media, Money } from "@/types";

import {
  OPEN_RENTAL_BOOKING_STATUSES,
  RENTAL_CONDITIONS,
  RENTAL_ITEM_MAX_MEDIA,
  RENTAL_UNITS,
  allowedBookingTransitions,
  type RentalBooking,
  type RentalBookingSortField,
  type RentalCategory,
  type RentalCategoryDraft,
  type RentalDepot,
  type RentalDepotDraft,
  type RentalItem,
  type RentalItemDraft,
  type RentalItemSortField,
  type RentalRate,
} from "../types";
import type { RentalAdminService } from "./rental.contract";

function selectItemSort(item: RentalItem, field: RentalItemSortField, locale: Locale): unknown {
  switch (field) {
    case "title":
      return localize(item.title, locale);
    case "status":
      return item.status;
    case "totalUnits":
      return item.totalUnits;
    case "updatedAt":
      return item.audit.updatedAt;
  }
}

function selectBookingSort(booking: RentalBooking, field: RentalBookingSortField): unknown {
  switch (field) {
    case "reference":
      return booking.reference;
    case "from":
      return booking.period.from;
    case "status":
      return booking.status;
    case "total":
      return booking.total.amount;
  }
}

/* ---- paging ---------------------------------------------------------------- */

/** Rows ordered by a name in the language the list is read in, with that language's collation. */
function byName<TRow>(
  rows: readonly TRow[],
  name: (row: TRow) => LocalizedText,
  locale: Locale,
  direction: "asc" | "desc" = "asc",
): TRow[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const sorted = [...rows].sort((a, b) => collator.compare(localize(name(a), locale), localize(name(b), locale)));
  return direction === "desc" ? sorted.reverse() : sorted;
}

/* ---- validation shared by the three editors -------------------------------- */

type Errors = Record<string, string>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRY = /^[A-Z]{2}$/;
const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;

const hasText = (value?: string) => Boolean(value?.trim());
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

/** A name the storefront shows in both languages: both are required. */
function requireBoth(errors: Errors, key: string, value: LocalizedText | undefined): void {
  if (!hasText(value?.en)) errors[`${key}.en`] = "Required.";
  if (!hasText(value?.ar)) errors[`${key}.ar`] = "Required.";
}

/** Optional text, but never in one language only — one storefront would show a gap. */
function bothOrNeither(errors: Errors, key: string, value: LocalizedText | undefined): void {
  const en = hasText(value?.en);
  const ar = hasText(value?.ar);
  if (en && !ar) errors[`${key}.ar`] = "Add the Arabic as well, or clear the English.";
  if (ar && !en) errors[`${key}.en`] = "Add the English as well, or clear the Arabic.";
}

/** Kept only when there is something in it, so an emptied description is removed rather than stored blank. */
const optionalText = (value: LocalizedText | undefined): LocalizedText | undefined =>
  value && (hasText(value.en) || hasText(value.ar)) ? { en: value.en, ar: value.ar } : undefined;

function checkSlug(
  errors: Errors,
  slug: unknown,
  taken: (slug: string) => boolean,
  { example, noun }: { example: string; noun: string },
): void {
  if (typeof slug !== "string" || !SLUG.test(slug)) {
    errors.slug = `Lower-case letters, numbers and hyphens, e.g. ${example}.`;
  } else if (taken(slug)) {
    errors.slug = `Another ${noun} already uses this address.`;
  }
}

function checkSports(errors: Errors, sportIds: unknown): void {
  if (!Array.isArray(sportIds)) errors.sportIds = "Choose from the sports list.";
  else if (sportIds.some((id) => !mockSports.some((sport) => sport.id === id))) {
    errors.sportIds = "One of these sports no longer exists.";
  }
}

const isJod = (value: Money | undefined): value is Money =>
  Boolean(value) && Number.isInteger(value!.amount) && value!.amount > 0 && value!.currency === "JOD";

const isWhole = (value: unknown, min: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min;

/**
 * A gallery: at most `RENTAL_ITEM_MAX_MEDIA` entries, each an image the upload
 * endpoint returned (or a video already on the record). One message, on
 * `media`, naming the first entry at fault by its position — the shared rules
 * in `@/lib`, the ones the API enforces.
 */
function checkMedia(errors: Errors, media: unknown): void {
  const problem = galleryProblem(media, RENTAL_ITEM_MAX_MEDIA);
  if (problem) errors.media = problem;
}

/**
 * What a save leaves in the gallery. A client that predates it sends no
 * `media` and keeps what is there; `null`, like `[]`, removes every image.
 */
function storedMedia(media: readonly Media[] | null | undefined, existing?: RentalItem): Media[] {
  if (media === undefined) return [...(existing?.media ?? [])];
  return media === null ? [] : storedGallery(media);
}

/** A readable id from the slug, or a random one when that is already taken. */
function readableId(prefix: string, slug: string, taken: (id: string) => boolean): string {
  const id = slug ? `${prefix}-${slug}` : "";
  return id && !taken(id) ? id : nextId(prefix);
}

/* ---- items ----------------------------------------------------------------- */

function validateItem(draft: RentalItemDraft, existing?: RentalItem): void {
  const errors: Errors = {};
  requireBoth(errors, "title", draft.title);
  requireBoth(errors, "summary", draft.summary);
  bothOrNeither(errors, "description", draft.description);
  checkSlug(
    errors,
    draft.slug,
    (slug) => mockRentalItems.some((item) => item.slug === slug && item.id !== existing?.id),
    { example: "sea-kayak", noun: "rental item" },
  );
  if (!PUBLISH_STATUSES.includes(draft.status)) errors.status = "Choose draft, published or archived.";
  if (!RENTAL_CONDITIONS.includes(draft.condition)) errors.condition = "Choose the condition the units are in.";
  if (!mockRentalLocations.some((depot) => depot.id === draft.depotId)) {
    errors.depotId = "Choose the depot units are collected from.";
  }
  if (!Array.isArray(draft.categoryIds) || draft.categoryIds.length === 0) {
    errors.categoryIds = "Choose at least one category.";
  } else if (draft.categoryIds.some((id) => !mockRentalCategories.some((category) => category.id === id))) {
    errors.categoryIds = "One of these categories no longer exists.";
  }
  checkSports(errors, draft.sportIds);
  checkMedia(errors, draft.media);

  if (!isWhole(draft.totalUnits, 1)) {
    errors.totalUnits = "A whole number, at least 1.";
  } else if (existing && draft.totalUnits < existing.unitsOutOfService) {
    errors.totalUnits = `${plural(existing.unitsOutOfService, "unit is", "units are")} out of service — bring them back first, or keep at least that many.`;
  }

  /* Rate errors are keyed by unit (`rates.day.price`) because the form has one
     row per unit, whichever of them are offered. */
  if (!Array.isArray(draft.rates) || draft.rates.length === 0) {
    errors.rates = "Offer at least one rate — by the hour, the day or the week.";
  } else {
    const seen = new Set<string>();
    for (const rate of draft.rates) {
      if (!RENTAL_UNITS.includes(rate?.unit)) {
        errors.rates = "Rates are by the hour, the day or the week.";
        continue;
      }
      if (seen.has(rate.unit)) errors.rates = "Each unit can have only one rate.";
      seen.add(rate.unit);
      const at = `rates.${rate.unit}`;
      if (!isJod(rate.price)) errors[`${at}.price`] = "A price above zero, in JOD.";
      if (!isWhole(rate.minUnits, 1)) errors[`${at}.minUnits`] = "A whole number, at least 1.";
      else if (rate.maxUnits != null && !isWhole(rate.maxUnits, rate.minUnits)) {
        errors[`${at}.maxUnits`] = "At least the minimum, or leave it empty for no limit.";
      }
    }
  }
  if (draft.deposit != null && !isJod(draft.deposit)) {
    errors.deposit = "An amount above zero, in JOD — or leave it empty for no deposit.";
  }

  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function buildItem(draft: RentalItemDraft, id: string, existing?: RentalItem): RentalItem {
  const depot = mockRentalLocations.find((entry) => entry.id === draft.depotId)!;
  const now = nowIso();
  /* Stored in one order — hour, day, week — so the list's "from" price is stable. */
  const rates: RentalRate[] = [...draft.rates]
    .sort((a, b) => RENTAL_UNITS.indexOf(a.unit) - RENTAL_UNITS.indexOf(b.unit))
    .map((rate) => ({
      unit: rate.unit,
      price: { amount: rate.price.amount, currency: rate.price.currency },
      minUnits: rate.minUnits,
      ...(rate.maxUnits != null ? { maxUnits: rate.maxUnits } : {}),
    }));
  return {
    id,
    slug: draft.slug,
    title: { en: draft.title.en, ar: draft.title.ar },
    summary: { en: draft.summary.en, ar: draft.summary.ar },
    description: optionalText(draft.description),
    media: storedMedia(draft.media as readonly Media[] | null | undefined, existing),
    status: draft.status,
    categoryIds: [...draft.categoryIds],
    sportIds: [...draft.sportIds],
    rates,
    deposit: draft.deposit != null ? { amount: draft.deposit.amount, currency: draft.deposit.currency } : undefined,
    location: { ...depot },
    condition: draft.condition,
    totalUnits: draft.totalUnits,
    unitsOutOfService: existing?.unitsOutOfService ?? 0,
    rating: existing?.rating ?? { average: 0, count: 0 },
    audit: existing
      ? { ...existing.audit, updatedAt: now, updatedBy: "staff" }
      : { createdAt: now, createdBy: "staff", updatedAt: now, updatedBy: "staff" },
  };
}

/* ---- categories ------------------------------------------------------------ */

/** True when `candidate` is `id` or sits somewhere beneath it. */
function isWithin(candidate: string | null, id: string): boolean {
  const visited = new Set<string>();
  let cursor = candidate;
  while (cursor && !visited.has(cursor)) {
    if (cursor === id) return true;
    visited.add(cursor);
    cursor = mockRentalCategories.find((category) => category.id === cursor)?.parentId ?? null;
  }
  return false;
}

function validateCategory(draft: RentalCategoryDraft, id?: string): void {
  const errors: Errors = {};
  requireBoth(errors, "name", draft.name);
  bothOrNeither(errors, "description", draft.description);
  checkSlug(
    errors,
    draft.slug,
    (slug) => mockRentalCategories.some((category) => category.slug === slug && category.id !== id),
    { example: "water-sports", noun: "rental category" },
  );
  if (draft.parentId != null) {
    if (!mockRentalCategories.some((category) => category.id === draft.parentId)) {
      errors.parentId = "That parent category no longer exists.";
    } else if (id && isWithin(draft.parentId, id)) {
      errors.parentId = "A category cannot sit under itself or one of its own sub-categories.";
    }
  }
  checkSports(errors, draft.sportIds);
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

const itemsInCategory = (id: string) => mockRentalItems.filter((item) => item.categoryIds.includes(id)).length;

const withItemCount = (category: RentalCategory): RentalCategory => ({
  ...category,
  itemCount: itemsInCategory(category.id),
});

function buildCategory(draft: RentalCategoryDraft, id: string): RentalCategory {
  return withItemCount({
    id,
    slug: draft.slug,
    name: { en: draft.name.en, ar: draft.name.ar },
    description: optionalText(draft.description),
    parentId: draft.parentId ?? null,
    sportIds: draft.sportIds ? [...draft.sportIds] : [],
    itemCount: 0,
  });
}

/* ---- depots ---------------------------------------------------------------- */

function validateDepot(draft: RentalDepotDraft, id?: string): void {
  const errors: Errors = {};
  requireBoth(errors, "name", draft.name);
  requireBoth(errors, "city", draft.city);
  if (
    !errors["name.en"] &&
    mockRentalLocations.some(
      (depot) => depot.id !== id && depot.name.en.trim().toLowerCase() === draft.name.en.trim().toLowerCase(),
    )
  ) {
    errors["name.en"] = "Another depot already has this name.";
  }
  if (typeof draft.countryCode !== "string" || !COUNTRY.test(draft.countryCode)) {
    errors.countryCode = "Two capital letters, e.g. JO.";
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function withStock(location: Location): RentalDepot {
  /* `location` is optional on `RentalItem` only because the live HTTP adapter has
     no source for it; every mock-built item always has one (`buildItem` always
     sets it), so a non-null assertion is safe here. */
  const stocked = mockRentalItems.filter((item) => item.location!.id === location.id);
  return {
    ...location,
    itemCount: stocked.length,
    totalUnits: stocked.reduce((sum, item) => sum + item.totalUnits, 0),
  };
}

export const mockRentalAdminService: RentalAdminService = {
  async listItems(query = {}) {
    await simulateLatency();
    const filtered = mockRentalItems.filter((item) => {
      const searchable = [item.slug, ...localizedValues(item.title), ...localizedValues(item.summary)];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(item.status)) return false;
      return true;
    });
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sorted =
      !query.sort || query.sort.field === "title"
        ? byName(filtered, (item) => item.title, locale, query.sort?.direction)
        : sortRows(
            filtered,
            (item) => selectItemSort(item, query.sort!.field, locale),
            query.sort.direction,
          );
    return paginate(sorted, query);
  },

  async getItem(id) {
    await simulateLatency();
    return mockRentalItems.find((item) => item.id === id) ?? null;
  },

  async createItem(draft) {
    await simulateLatency();
    validateItem(draft);
    const id = readableId("rent", draft.slug, (candidate) => mockRentalItems.some((item) => item.id === candidate));
    const item = buildItem(draft, id);
    mockRentalItems.push(item);
    /* Pictures reach the storefront; the rest of the catalogue does not (`pushCatalogueImages`). */
    pushCatalogueImages("rental-item", item.id, ["media"], undefined, item);
    return item;
  },

  async updateItem(id, draft) {
    await simulateLatency();
    const index = mockRentalItems.findIndex((item) => item.id === id);
    const existing = mockRentalItems[index];
    if (!existing) throw notFound(`Rental item "${id}"`);
    validateItem(draft, existing);
    const item = buildItem(draft, id, existing);
    mockRentalItems[index] = item;
    pushCatalogueImages("rental-item", id, ["media"], existing, item);
    return item;
  },

  async deleteItem(id) {
    await simulateLatency();
    const index = mockRentalItems.findIndex((item) => item.id === id);
    if (index < 0) throw notFound(`Rental item "${id}"`);
    /* A returned or cancelled hire keeps its own copy of the title, so only the
       bookings still to be collected or brought back hold the item in place. */
    const open = mockRentalBookings.filter(
      (booking) => booking.itemId === id && OPEN_RENTAL_BOOKING_STATUSES.includes(booking.status),
    ).length;
    if (open > 0) {
      throw new AppError(
        "conflict",
        `${plural(open, "booking still needs", "bookings still need")} this item (pending, confirmed or collected). Close or cancel ${open === 1 ? "it" : "them"} first.`,
        { status: 409 },
      );
    }
    mockRentalItems.splice(index, 1);
  },

  async setUnitsOutOfService(id, unitsOutOfService) {
    await simulateLatency();
    const index = mockRentalItems.findIndex((item) => item.id === id);
    const item = mockRentalItems[index];
    if (!item) throw notFound(`Rental item "${id}"`);
    if (!isWhole(unitsOutOfService, 0) || unitsOutOfService > item.totalUnits) {
      throw validationFailed({
        unitsOutOfService: `Must be between 0 and ${item.totalUnits}.`,
      });
    }
    const updated: RentalItem = {
      ...item,
      unitsOutOfService,
      audit: { ...item.audit, updatedAt: nowIso(), updatedBy: "admin-3" },
    };
    mockRentalItems[index] = updated;
    return updated;
  },

  async listBookings(query = {}) {
    await simulateLatency();
    const filtered = mockRentalBookings.filter((booking) => {
      const searchable = [
        booking.reference,
        booking.customerName,
        ...localizedValues(booking.itemTitle),
      ];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(booking.status)) return false;
      if (query.itemId && booking.itemId !== query.itemId) return false;
      if (query.customerId && booking.customerId !== query.customerId) return false;
      if (query.orderId && booking.orderId !== query.orderId) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (b) => selectBookingSort(b, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (b) => b.period.from, "asc");
    return paginate(sorted, query);
  },

  async getBooking(id) {
    await simulateLatency();
    return mockRentalBookings.find((booking) => booking.id === id) ?? null;
  },

  async setBookingStatus(id, status) {
    await simulateLatency();
    const index = mockRentalBookings.findIndex((booking) => booking.id === id);
    const booking = mockRentalBookings[index];
    if (!booking) throw notFound(`Booking "${id}"`);
    if (!allowedBookingTransitions(booking.status).includes(status)) {
      throw new AppError(
        "conflict",
        `A booking that is "${booking.status}" cannot move to "${status}".`,
      );
    }
    const updated: RentalBooking = {
      ...booking,
      status,
      audit: { ...booking.audit, updatedAt: nowIso(), updatedBy: "admin-5" },
    };
    mockRentalBookings[index] = updated;
    pushToStorefront("rental", id, { status });
    return updated;
  },

  async releaseDeposit(id) {
    await simulateLatency();
    const index = mockRentalBookings.findIndex((booking) => booking.id === id);
    const booking = mockRentalBookings[index];
    if (!booking) throw notFound(`Booking "${id}"`);
    if (!booking.deposit) {
      throw validationFailed({ deposit: "This booking has no deposit to release." });
    }
    if (booking.status !== "returned") {
      throw new AppError("conflict", "A deposit can only be released once the item is returned.");
    }
    const updated: RentalBooking = {
      ...booking,
      depositReleasedAt: nowIso(),
      audit: { ...booking.audit, updatedAt: nowIso(), updatedBy: "admin-5" },
    };
    mockRentalBookings[index] = updated;
    pushToStorefront("rental", id, { depositReleasedAt: updated.depositReleasedAt });
    return updated;
  },

  async listCategories() {
    await simulateLatency();
    /* Counted on every read, so a new, moved or deleted item shows at once. */
    return mockRentalCategories.map(withItemCount);
  },

  async listCategoriesPage(query = {}) {
    await simulateLatency();
    const filtered = mockRentalCategories
      .filter((category) => matchesText([category.slug, ...localizedValues(category.name)], query.search))
      .map(withItemCount);
    const locale = query.locale ?? DEFAULT_LOCALE;
    return paginate(byName(filtered, (category) => category.name, locale, query.sort?.direction), query);
  },

  async createCategory(draft) {
    await simulateLatency();
    validateCategory(draft);
    const id = readableId("rcat", draft.slug, (candidate) =>
      mockRentalCategories.some((category) => category.id === candidate),
    );
    const category = buildCategory(draft, id);
    mockRentalCategories.push(category);
    return category;
  },

  async updateCategory(id, draft) {
    await simulateLatency();
    const index = mockRentalCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Rental category "${id}"`);
    validateCategory(draft, id);
    const category = buildCategory(draft, id);
    mockRentalCategories[index] = category;
    return category;
  },

  async deleteCategory(id) {
    await simulateLatency();
    const index = mockRentalCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Rental category "${id}"`);
    const items = itemsInCategory(id);
    if (items > 0) {
      throw new AppError(
        "conflict",
        `${plural(items, "rental item is", "rental items are")} filed under this category. Move ${items === 1 ? "it" : "them"} first.`,
        { status: 409 },
      );
    }
    const children = mockRentalCategories.filter((category) => category.parentId === id).length;
    if (children > 0) {
      throw new AppError(
        "conflict",
        `${plural(children, "sub-category sits", "sub-categories sit")} under this category. Move or delete ${children === 1 ? "it" : "them"} first.`,
        { status: 409 },
      );
    }
    mockRentalCategories.splice(index, 1);
  },

  async listDepots() {
    await simulateLatency();
    return mockRentalLocations.map(withStock);
  },

  async listDepotsPage(query = {}) {
    await simulateLatency();
    const filtered = mockRentalLocations
      .filter((depot) =>
        matchesText([...localizedValues(depot.name), ...localizedValues(depot.city), depot.countryCode], query.search),
      )
      .map(withStock);
    const locale = query.locale ?? DEFAULT_LOCALE;
    return paginate(byName(filtered, (depot) => depot.name, locale, query.sort?.direction), query);
  },

  async createDepot(draft) {
    await simulateLatency();
    validateDepot(draft);
    const id = readableId("loc", slugify(draft.name.en), (candidate) =>
      mockRentalLocations.some((depot) => depot.id === candidate),
    );
    const depot: Location = {
      id,
      name: { en: draft.name.en, ar: draft.name.ar },
      city: { en: draft.city.en, ar: draft.city.ar },
      countryCode: draft.countryCode,
    };
    mockRentalLocations.push(depot);
    return withStock(depot);
  },

  async updateDepot(id, draft) {
    await simulateLatency();
    const index = mockRentalLocations.findIndex((depot) => depot.id === id);
    if (index < 0) throw notFound(`Depot "${id}"`);
    validateDepot(draft, id);
    const depot: Location = {
      id,
      name: { en: draft.name.en, ar: draft.name.ar },
      city: { en: draft.city.en, ar: draft.city.ar },
      countryCode: draft.countryCode,
    };
    mockRentalLocations[index] = depot;
    /* Every item carries a copy of its depot; a renamed depot is renamed there too. */
    mockRentalItems.forEach((item, at) => {
      if (item.location!.id === id) mockRentalItems[at] = { ...item, location: { ...depot } };
    });
    return withStock(depot);
  },

  async deleteDepot(id) {
    await simulateLatency();
    const index = mockRentalLocations.findIndex((depot) => depot.id === id);
    if (index < 0) throw notFound(`Depot "${id}"`);
    const stocked = mockRentalItems.filter((item) => item.location!.id === id).length;
    if (stocked > 0) {
      throw new AppError(
        "conflict",
        `${plural(stocked, "rental item is", "rental items are")} stocked at this depot. Move ${stocked === 1 ? "it" : "them"} to another depot first.`,
        { status: 409 },
      );
    }
    mockRentalLocations.splice(index, 1);
  },
};
