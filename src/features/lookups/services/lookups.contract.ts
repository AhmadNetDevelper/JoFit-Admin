import type { ListQuery, Paginated } from "@/types";

import type { LookupDraft, LookupEntry, LookupKind } from "../types";

export interface LookupsService {
  /** One page of `kind`'s table (`GET /v1/{ApiSegment}`). `search` matches either language's name. */
  listPage(kind: LookupKind, query?: ListQuery): Promise<Paginated<LookupEntry>>;
  /** 422 with field errors when a name is missing, or (`city`) the country is missing. */
  create(kind: LookupKind, draft: LookupDraft): Promise<LookupEntry>;
  update(kind: LookupKind, id: string, draft: LookupDraft): Promise<LookupEntry>;
  remove(kind: LookupKind, id: string): Promise<void>;
  /**
   * Every active country, for the `city` tab's country picker
   * (`countryId` field and the table's country column).
   */
  listCountries(): Promise<readonly LookupEntry[]>;
  /** Every city, for `features/identity`'s user profile (resolving/picking `cityId`). */
  listCities(): Promise<readonly LookupEntry[]>;
  /** Every job status, for `features/identity`'s user profile (resolving/picking `jobStatusId`). */
  listJobStatuses(): Promise<readonly LookupEntry[]>;
}
