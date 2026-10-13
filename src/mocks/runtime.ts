import { apiConfig } from "@/config";

/**
 * Helpers shared by every mock adapter.
 *
 * Everything under `src/mocks` is deletable: when the backend lands, the HTTP
 * adapters replace the mock adapters and this whole tree is removed. Only
 * `*.mock.ts` files may import from here, and ESLint enforces that.
 *
 * NOTE ON WRITES: the admin's mock adapters mutate module-level arrays, so edits
 * survive navigation but are lost on reload. That is deliberate — it exercises
 * the write path end to end without pretending anything is persisted.
 */
export async function simulateLatency(): Promise<void> {
  if (apiConfig.mockLatencyMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, apiConfig.mockLatencyMs));
}

export function matchesText(haystack: readonly (string | undefined)[], needle?: string): boolean {
  if (!needle) return true;
  const term = needle.trim().toLowerCase();
  if (!term) return true;
  return haystack.some((value) => value?.toLowerCase().includes(term));
}

export function matchesAny(values: readonly string[], allowed?: readonly string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return values.some((value) => allowed.includes(value));
}

/** Deterministic comparator used by the mock sorters. */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

export function sortRows<TRow>(
  rows: readonly TRow[],
  select: (row: TRow) => unknown,
  direction: "asc" | "desc",
): TRow[] {
  const sorted = [...rows].sort((a, b) => compareValues(select(a), select(b)));
  return direction === "desc" ? sorted.reverse() : sorted;
}

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A seeded generator, so generated fixtures are identical on every reload and a
 * screenshot taken today matches one taken tomorrow.
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Stable per-id seed, for fixtures derived from a record rather than a sequence. */
export function hashSeed(value: string): number {
  let acc = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    acc ^= value.charCodeAt(index);
    acc = Math.imul(acc, 16_777_619);
  }
  return acc >>> 0;
}

const MS_PER_DAY = 86_400_000;

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * GENERATED DATES ARE RELATIVE TO TODAY.
 *
 * The same rule the storefront follows for course intakes and coach slots: a
 * fixture that names a date names the day it was typed, and a bookings queue
 * full of last month's pickups reads as a broken screen. `daysFromToday(-3)` is
 * three days ago, `daysFromToday(10)` is ten days out.
 */
export function daysFromToday(days: number): string {
  return new Date(todayUtc() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** A local Amman time on a relative day, e.g. `atTime(-2, 9, 30)`. */
export function atTime(days: number, hours: number, minutes = 0): string {
  return `${daysFromToday(days)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+03:00`;
}

/** Every language's value for a localized field, so search matches either. */
export function localizedValues(
  text: Readonly<Partial<Record<string, string>>> | undefined,
): string[] {
  if (!text) return [];
  return Object.values(text).filter((value): value is string => typeof value === "string");
}
