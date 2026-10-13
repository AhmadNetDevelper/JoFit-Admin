import { lookupsService, type LookupEntry } from "@/features/lookups";

/** The reference tables an account's country, city and job status point into. */
export interface IdentityOptions {
  readonly countries: readonly LookupEntry[];
  readonly cities: readonly LookupEntry[];
  readonly jobStatuses: readonly LookupEntry[];
}

export async function loadIdentityOptions(): Promise<IdentityOptions> {
  const [countries, cities, jobStatuses] = await Promise.all([
    lookupsService.listCountries(),
    lookupsService.listCities(),
    lookupsService.listJobStatuses(),
  ]);
  return { countries, cities, jobStatuses };
}

export const entryLabel = (entry: LookupEntry) => ({ en: entry.nameEn, ar: entry.nameAr });
