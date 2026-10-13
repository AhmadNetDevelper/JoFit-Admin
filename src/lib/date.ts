const MS_PER_DAY = 86_400_000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return toIsoDate(new Date(date.getTime() + days * MS_PER_DAY));
}

export function eachDateInRange(range: { from: string; to: string }): string[] {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  if (!from || !to || from > to) return [];
  const dates: string[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += MS_PER_DAY) {
    dates.push(toIsoDate(new Date(t)));
  }
  return dates;
}

export function formatDate(value: string, locale = "en"): string {
  const date = parseIsoDate(value.slice(0, 10));
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function formatDateTime(value: string, locale = "en"): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export function nowIso(): string {
  return new Date().toISOString();
}
