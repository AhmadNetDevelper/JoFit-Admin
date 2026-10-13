import { AppError, imageProblem, notFound, paginate, storedImage, validationFailed } from "@/lib";
import { pushCatalogueImages } from "@/mocks/bridge";
import { mockProducts } from "@/mocks/catalogue";
import { mockCoaches } from "@/mocks/coaches";
import { mockCourses } from "@/mocks/education";
import { mockRentalItems } from "@/mocks/rental";
import { matchesText, simulateLatency } from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { MediaImage } from "@/types";

import type { Sport, SportDraft } from "../types";
import type { SportsService } from "./sports.contract";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Both names, a free, well-formed slug and a valid image — the same rules for create and update. */
function validate(draft: SportDraft, id?: string): SportDraft {
  const errors: Record<string, string> = {};
  const name = { en: draft.name?.en?.trim() ?? "", ar: draft.name?.ar?.trim() ?? "" };
  if (!name.en) errors["name.en"] = "Required.";
  if (!name.ar) errors["name.ar"] = "Required.";
  if (typeof draft.slug !== "string" || !SLUG.test(draft.slug)) {
    errors.slug = "Lower-case letters, numbers and hyphens, e.g. beach-volleyball.";
  } else if (mockSports.some((sport) => sport.slug === draft.slug && sport.id !== id)) {
    errors.slug = "Another sport already uses this address.";
  }
  const problem = imageProblem(draft.image);
  if (problem) errors.image = problem;
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  /* Only the known fields are kept; `null` (a removed image) clears it, and a blank description is none. */
  const image: MediaImage | undefined = draft.image ? storedImage(draft.image) : undefined;
  const description = { en: draft.description?.en?.trim() ?? "", ar: draft.description?.ar?.trim() ?? "" };
  return {
    slug: draft.slug,
    name,
    isFeatured: Boolean(draft.isFeatured),
    ...(description.en || description.ar ? { description } : {}),
    ...(image ? { image } : {}),
  };
}

/** How many records are filed under a sport — a sport in use cannot be deleted. */
function usage(id: string): number {
  // Courses' `sportIds` is optional (the live course DTO has no such field at all) — treated as empty.
  const uses = (rows: readonly { readonly sportIds?: readonly string[] }[]) =>
    rows.filter((row) => (row.sportIds ?? []).includes(id)).length;
  return uses(mockProducts) + uses(mockRentalItems) + uses(mockCoaches) + uses(mockCourses);
}

export const mockSportsService: SportsService = {
  async list() {
    await simulateLatency();
    return mockSports;
  },

  async listPage(query = {}) {
    await simulateLatency();
    const locale = query.locale ?? "en";
    const rows = mockSports.filter((sport) => matchesText([sport.name.en, sport.name.ar, sport.slug], query.search));
    const key = (sport: Sport) => (query.sort?.field === "slug" ? sport.slug : sport.name[locale] || sport.name.en);
    const sorted = [...rows].sort((a, b) => key(a).localeCompare(key(b), locale));
    return paginate(query.sort?.direction === "desc" ? sorted.reverse() : sorted, query);
  },

  async getManyByIds(ids) {
    await simulateLatency();
    return mockSports.filter((sport) => ids.includes(sport.id));
  },

  async setFeatured(id, isFeatured) {
    await simulateLatency();
    const index = mockSports.findIndex((sport) => sport.id === id);
    const existing = mockSports[index];
    if (!existing) throw notFound(`Sport "${id}"`);
    const updated = { ...existing, isFeatured };
    mockSports[index] = updated;
    return updated;
  },

  async create(draft) {
    await simulateLatency();
    const clean = validate(draft);
    const sport: Sport = { ...clean, id: `sport-${clean.slug}` };
    mockSports.push(sport);
    /* Pictures reach the storefront; the rest of the sport does not (`pushCatalogueImages`). */
    pushCatalogueImages("sport", sport.id, ["image"], undefined, sport);
    return sport;
  },

  async update(id, draft) {
    await simulateLatency();
    const index = mockSports.findIndex((sport) => sport.id === id);
    if (index < 0) throw notFound(`Sport "${id}"`);
    const previous = mockSports[index];
    const sport: Sport = { ...validate(draft, id), id };
    mockSports[index] = sport;
    pushCatalogueImages("sport", id, ["image"], previous, sport);
    return sport;
  },

  async remove(id) {
    await simulateLatency();
    const index = mockSports.findIndex((sport) => sport.id === id);
    if (index < 0) throw notFound(`Sport "${id}"`);
    const count = usage(id);
    if (count > 0) {
      throw new AppError("conflict", `${count} products, hires, coaches or courses are filed under this sport. Move them first.`, {
        status: 409,
      });
    }
    mockSports.splice(index, 1);
  },
};
