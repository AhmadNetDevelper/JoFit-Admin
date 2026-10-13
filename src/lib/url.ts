export type QueryParamValue = string | number | boolean | undefined | null;

export function buildQueryString(
  params: Record<string, QueryParamValue | readonly QueryParamValue[]>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === undefined || entry === null || entry === "") continue;
        search.append(key, String(entry));
      }
      continue;
    }
    search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

export function readNumberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
