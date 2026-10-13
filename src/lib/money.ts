import type { CurrencyCode, Money } from "@/types";

const MINOR_UNIT_DIGITS: Readonly<Record<CurrencyCode, number>> = {
  JOD: 3,
  USD: 2,
  EUR: 2,
  SAR: 2,
  AED: 2,
};

export function minorUnitDigits(currency: CurrencyCode): number {
  return MINOR_UNIT_DIGITS[currency];
}

export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add ${a.currency} to ${b.currency}.`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function multiplyMoney(value: Money, factor: number): Money {
  return { amount: Math.round(value.amount * factor), currency: value.currency };
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode): Money {
  return values.reduce(addMoney, zeroMoney(currency));
}

export function toMajorUnits(value: Money): number {
  return value.amount / 10 ** MINOR_UNIT_DIGITS[value.currency];
}

export function formatMoney(value: Money, locale = "en"): string {
  const digits = MINOR_UNIT_DIGITS[value.currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toMajorUnits(value));
}

/**
 * Parses a price typed by a member of staff (major units, e.g. "24.50") into
 * minor units. Returns `null` for anything unparseable so the caller can raise a
 * field error rather than silently writing a wrong price.
 *
 * Admin-only: the storefront never converts user input into money.
 */
export function parseMoneyInput(input: string, currency: CurrencyCode): Money | null {
  const trimmed = input.trim();
  if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const amount = Math.round(Number(trimmed) * 10 ** MINOR_UNIT_DIGITS[currency]);
  return Number.isFinite(amount) ? { amount, currency } : null;
}

/** Formats money for an editable input: major units, no currency symbol. */
export function toMoneyInputValue(value: Money): string {
  return toMajorUnits(value).toFixed(MINOR_UNIT_DIGITS[value.currency]);
}
