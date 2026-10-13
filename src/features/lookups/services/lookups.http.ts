import { adminListParams, httpClient } from "@/services";
import type { PageMeta, Paginated } from "@/types";

import { LOOKUP_KIND_META, type LookupDraft, type LookupEntry, type LookupKind } from "../types";
import type { LookupsService } from "./lookups.contract";

const enc = encodeURIComponent;

/**
 * The seven tables over `/v1/{ApiSegment}` — NOT under `/v1/admin`, unlike
 * every other admin resource: the live spec puts this reference data at the
 * API root (`/api/v1/AcademicDegree`, `/api/v1/City`, …), one path segment per
 * kind (`LOOKUP_KIND_META`). Every call still needs the staff bearer token
 * (`auth: true`) — these endpoints are `security: [Bearer]` in the spec same
 * as everything else.
 *
 * WIRE SHAPE. The live DTOs use an `int64 id` (and `int64 countryId` for
 * `City`); every id elsewhere in this admin is a `string`, so `fromDto`/`body`
 * convert at the boundary. The paged response carries both a flat
 * `page/pageSize/totalCount/…` and a nested `meta` with exactly this admin's
 * own `PageMeta` shape (`page, pageSize, totalItems, totalPages,
 * hasNextPage, hasPreviousPage`) — `items` + `meta` is read directly as this
 * admin's `Paginated<T>`, same as every other adapter.
 */
const path = (kind: LookupKind, suffix = "") => `/v1/${LOOKUP_KIND_META[kind].apiSegment}${suffix}`;

interface LookupEntryDto {
  readonly id: number;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly isActive: boolean;
  readonly countryId?: number;
  readonly isNormalUser?: boolean;
}

interface LookupPageDto {
  readonly items: readonly LookupEntryDto[];
  readonly meta: PageMeta;
}

function fromDto(dto: LookupEntryDto): LookupEntry {
  return {
    id: String(dto.id),
    nameAr: dto.nameAr,
    nameEn: dto.nameEn,
    isActive: dto.isActive,
    ...(dto.countryId !== undefined ? { countryId: String(dto.countryId) } : {}),
    ...(dto.isNormalUser !== undefined ? { isNormalUser: dto.isNormalUser } : {}),
  };
}

/**
 * Only the fields the live API accepts on write. `isNormalUser` is read-only
 * on `UserJobTypeDto` — absent from both `CreateUserJobTypeRequest` and
 * `UpdateUserJobTypeRequest` in the live spec — so it is never sent, even
 * though `LookupDraft` structurally carries it.
 */
function body(kind: LookupKind, draft: LookupDraft): Record<string, unknown> {
  return {
    nameAr: draft.nameAr,
    nameEn: draft.nameEn,
    isActive: draft.isActive,
    ...(kind === "city" ? { countryId: draft.countryId ? Number(draft.countryId) : undefined } : {}),
  };
}

export const httpLookupsService: LookupsService = {
  listPage: async (kind, query = {}) => {
    const page = await httpClient.get<LookupPageDto>(path(kind), { query: adminListParams(query), auth: true });
    return { items: page.items.map(fromDto), meta: page.meta } satisfies Paginated<LookupEntry>;
  },

  create: async (kind, draft) => fromDto(await httpClient.post<LookupEntryDto>(path(kind), body(kind, draft), { auth: true })),

  update: async (kind, id, draft) =>
    fromDto(await httpClient.put<LookupEntryDto>(path(kind, `/${enc(id)}`), body(kind, draft), { auth: true })),

  remove: async (kind, id) => {
    await httpClient.delete<void>(path(kind, `/${enc(id)}`), { auth: true });
  },

  /**
   * `GET /api/v1/Country/all` only returns one resolved name per the live
   * spec (`CountryLookupDto {id, name}`, picked by a `language` parameter),
   * not both languages — using it would leave either `nameEn` or `nameAr`
   * blank here, breaking the bilingual table and the country picker's own
   * label. The paged list (`CountryDto {id, nameAr, nameEn, isActive}`) keeps
   * both, at the cost of one call sized to cover every country at once.
   */
  listCountries: async () => {
    const page = await httpClient.get<LookupPageDto>(path("country"), {
      query: { pageSize: 200 },
      auth: true,
    });
    return page.items.map(fromDto);
  },

  listCities: async () => {
    const page = await httpClient.get<LookupPageDto>(path("city"), { query: { pageSize: 200 }, auth: true });
    return page.items.map(fromDto);
  },

  listJobStatuses: async () => {
    const page = await httpClient.get<LookupPageDto>(path("job-status"), { query: { pageSize: 200 }, auth: true });
    return page.items.map(fromDto);
  },
};
