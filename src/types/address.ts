import type { LocalizedText } from "./localized";

export interface Address {
  readonly id: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly region?: string;
  readonly postalCode?: string;
  /** ISO 3166-1 alpha-2. */
  readonly countryCode: string;
}

/**
 * A venue the platform operates — a rental depot, a coaching base. Its name is
 * platform-authored, so it is held in every language like any other copy the
 * storefront prints: `/ar/rental` must not show "Amman Hub" beside Arabic prose.
 */
export interface Location {
  readonly id: string;
  readonly name: LocalizedText;
  readonly city: LocalizedText;
  readonly countryCode: string;
}
