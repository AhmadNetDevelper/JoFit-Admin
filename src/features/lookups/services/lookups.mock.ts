import { notFound, paginate, validationFailed } from "@/lib";
import { mockLookups } from "@/mocks/lookups";
import { matchesText, nextId, simulateLatency } from "@/mocks/runtime";

import type { LookupDraft, LookupEntry, LookupKind } from "../types";
import type { LookupsService } from "./lookups.contract";

const rowsFor = (kind: LookupKind): LookupEntry[] => mockLookups[kind];

/** Both names, and — for `city` — a country that exists. Same rules for create and update. */
function validate(kind: LookupKind, draft: LookupDraft, id?: string): LookupDraft {
  const errors: Record<string, string> = {};
  const nameEn = draft.nameEn?.trim() ?? "";
  const nameAr = draft.nameAr?.trim() ?? "";
  if (!nameEn) errors.nameEn = "Required.";
  if (!nameAr) errors.nameAr = "Required.";
  const rows = rowsFor(kind);
  if (nameEn && rows.some((row) => row.id !== id && row.nameEn.toLowerCase() === nameEn.toLowerCase())) {
    errors.nameEn = "Another record already uses this name.";
  }
  const countryId = kind === "city" ? draft.countryId : undefined;
  if (kind === "city" && !mockLookups.country.some((country) => country.id === countryId)) {
    errors.countryId = "Choose a country.";
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return {
    nameEn,
    nameAr,
    isActive: draft.isActive ?? true,
    ...(kind === "city" ? { countryId } : {}),
  };
}

function requireRow(kind: LookupKind, id: string): number {
  const index = rowsFor(kind).findIndex((row) => row.id === id);
  if (index < 0) throw notFound(`"${id}"`);
  return index;
}

export const mockLookupsService: LookupsService = {
  async listPage(kind, query = {}) {
    await simulateLatency();
    const locale = query.locale ?? "en";
    const rows = rowsFor(kind).filter((row) => matchesText([row.nameEn, row.nameAr], query.search));
    const key = (row: LookupEntry) => (locale === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr);
    const sorted = [...rows].sort((a, b) => key(a).localeCompare(key(b), locale));
    return paginate(query.sort?.direction === "desc" ? sorted.reverse() : sorted, query);
  },

  async create(kind, draft) {
    await simulateLatency();
    const clean = validate(kind, draft);
    const row: LookupEntry = { ...clean, id: nextId(kind) };
    rowsFor(kind).push(row);
    return row;
  },

  async update(kind, id, draft) {
    await simulateLatency();
    const rows = rowsFor(kind);
    const index = requireRow(kind, id);
    const clean = validate(kind, draft, id);
    const row: LookupEntry = { ...rows[index], ...clean, id };
    rows[index] = row;
    return row;
  },

  async remove(kind, id) {
    await simulateLatency();
    const rows = rowsFor(kind);
    const index = requireRow(kind, id);
    rows.splice(index, 1);
  },

  async listCountries() {
    await simulateLatency();
    return mockLookups.country;
  },

  async listCities() {
    await simulateLatency();
    return mockLookups.city;
  },

  async listJobStatuses() {
    await simulateLatency();
    return mockLookups["job-status"];
  },
};
