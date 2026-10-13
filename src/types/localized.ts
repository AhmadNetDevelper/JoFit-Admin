import type { Locale } from "@/i18n/locales";

/**
 * Text the platform authors, held in every language at once.
 *
 * ADMIN vs STOREFRONT
 * The admin edits all locales, so it stores `LocalizedText`. The storefront
 * receives one already-resolved string per request, because a public page needs
 * one language and shipping the other is waste. That asymmetry is a reason the
 * two apps do not share these models.
 *
 * WHAT IS *NOT* LOCALIZED
 * Only platform-authored content is. Customer names, review bodies, quotation
 * messages, SKUs and references are real-world data in whatever language they
 * were written — translating them would be wrong, so they stay plain `string`.
 */
export type LocalizedText = Readonly<Record<Locale, string>>;

/** A localized field that may legitimately be blank in some languages. */
export type PartialLocalizedText = Readonly<Partial<Record<Locale, string>>>;
