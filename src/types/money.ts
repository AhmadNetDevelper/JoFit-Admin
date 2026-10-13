/**
 * Money is stored in MINOR units (fils, cents) as an integer, never a float.
 *
 * This matters more in the admin than on the storefront: staff *enter* prices
 * here, so `lib/money.ts` also provides parsing from a major-unit input string.
 */
export type CurrencyCode = "JOD" | "USD" | "EUR" | "SAR" | "AED";

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface MoneyRange {
  readonly min: Money;
  readonly max: Money;
}
