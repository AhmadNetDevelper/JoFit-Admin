import type { SportId } from "@/features/sports";
import type {
  AuditInfo,
  ListQuery,
  LocalizedText,
  Media,
  MediaImage,
  Money,
  PartialLocalizedText,
  PublishStatus,
  RatingSummary,
  SeoMeta,
} from "@/types";

/**
 * ADMIN MODELS ARE NOT STOREFRONT MODELS.
 *
 * The storefront's `Product` is a *public projection*: it has a price range and a
 * coarse stock signal. The admin's `AdminProduct` is the write model — it carries
 * exact stock counts, cost prices, an editorial status and audit fields, none of
 * which the public may ever see.
 *
 * Treating these as one shared type would force the storefront to either receive
 * commercially sensitive fields or make them optional everywhere. They are
 * separate on purpose.
 *
 * LOCALIZATION
 * Prose the platform authors is `LocalizedText` — staff edit every language here,
 * while the storefront receives one resolved string. Proper nouns and option
 * values are NOT localized: a brand is called "Apex" in both languages, and a
 * shoe size is "42" in both.
 */
export interface Brand {
  readonly id: string;
  readonly slug: string;
  /** A proper noun — deliberately not localized. */
  readonly name: string;
  readonly description?: PartialLocalizedText;
  /** Shown on a plain ground, so it is drawn whole (`contain`), never cropped. */
  readonly logo?: MediaImage;
  readonly productCount: number;
  readonly audit: AuditInfo;
}

export interface ProductCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: PartialLocalizedText;
  readonly parentId: string | null;
  /** Live `ProductCategoryDto` has no `sportIds` field at all — nothing to read or write it against. */
  readonly sportIds?: readonly SportId[];
  readonly image?: MediaImage;
  readonly productCount: number;
  readonly audit: AuditInfo;
}

export interface ProductOption {
  /**
   * The untranslated identifier `AdminProductVariant.selections` is keyed by —
   * the storefront's contract. `name` is what a shopper reads and changes with
   * the language; `key` never does, or a variant cannot be matched on `/ar`.
   */
  readonly key: string;
  readonly name: LocalizedText;
  /** Values such as "M" or "42" read the same in both languages. */
  readonly values: readonly string[];
}

export interface AdminProductVariant {
  readonly id: string;
  readonly sku: string;
  /** Built from option values, so it needs no translation. */
  readonly title: string;
  /** Live `AdminVariantDto` has no `selections` map at all — the size/color picker has nothing to bind to. */
  readonly selections?: Readonly<Record<string, string>>;
  readonly price: Money;
  /** The struck-through reference price the storefront shows beside a discount. */
  readonly compareAtPrice?: Money;
  /** Never leaves the admin. */
  readonly costPrice?: Money;
  /** Exact count — the admin is the only place this is shown. */
  readonly stockOnHand: number;
  /** Below this, the product surfaces in the low-stock filter. */
  readonly lowStockThreshold: number;
  readonly isActive: boolean;
}

export interface AdminProduct {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly status: PublishStatus;
  readonly brandId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  /** Display order; the first image is the cover the storefront's cards show. At most 12. */
  readonly media: readonly Media[];
  readonly options: readonly ProductOption[];
  readonly variants: readonly AdminProductVariant[];
  /** Read-only here: ratings are produced by customers, not by staff. */
  readonly rating: RatingSummary;
  readonly seo?: SeoMeta;
  readonly audit: AuditInfo;
}

/** The most images a product's gallery holds — the form stops adding at this, and the API refuses more. */
export const PRODUCT_MEDIA_MAX = 12;

export const PRODUCT_SORT_FIELDS = ["title", "status", "stock", "price", "updatedAt"] as const;
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export interface ProductListQuery extends ListQuery<ProductSortField> {
  readonly statuses?: readonly PublishStatus[];
  readonly categoryIds?: readonly string[];
  readonly brandIds?: readonly string[];
  readonly sportIds?: readonly SportId[];
  readonly lowStockOnly?: boolean;
  /*
   * NOT WIRED: the live `GET /admin/products` also accepts `StockStatuses`
   * (an array of strings) for server-side stock filtering, which this query
   * has no field for. Left out rather than guessed — the live spec declares
   * it as a bare `string[]` with no enum, and nothing else in the codebase
   * documents the accepted values (admin models stock as a plain
   * `stockOnHand`/`lowStockThreshold` pair, not a `StockStatus` enum like the
   * storefront's shop domain does), so wiring it up risks the same silent
   * no-op class of bug as the `locale`→`language` rename found elsewhere in
   * this API. Confirm the accepted strings with the backend before adding it.
   */
}

/**
 * The editable subset of a product. A patch type rather than the full entity, so
 * a save can never silently overwrite fields the form does not show — including
 * `audit`, which only the server may set.
 */
export interface ProductDraft {
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly status: PublishStatus;
  readonly brandId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  /**
   * The gallery, uploaded image by image through `mediaService` and saved here
   * as values — the save itself carries no files. A body without it keeps the
   * gallery as it is.
   */
  readonly media: readonly Media[];
  readonly seo?: SeoMeta;
}

/**
 * The first thing on sale under a new product. A product cannot exist without a
 * variant — the variant is what carries the SKU, the price and the stock — so a
 * new product is created with exactly one. Its selections are empty: options
 * such as size or colour are a later edit, not a precondition.
 */
export interface NewProductVariant {
  readonly sku: string;
  readonly price: Money;
  /** Opening stock: an absolute count, the one time stock is not a delta. */
  readonly stockOnHand: number;
}

/** A product being created: the editable fields plus its first variant. */
export interface NewProductDraft extends ProductDraft {
  readonly variant: NewProductVariant;
}

/**
 * The editable part of a product category. The product count and audit fields
 * are the server's. `description` is always both languages here, even when the
 * stored record has none — an empty box is simpler to edit than a missing one.
 */
export interface ProductCategoryDraft {
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly parentId: string | null;
  /** Live `ProductCategoryDraftRequest` has no `sportIds` field — never sent; see `ProductCategory.sportIds`. */
  readonly sportIds?: readonly SportId[];
  /** `undefined` (or `null` in a request body) is no image; a body without the key keeps the current one. */
  readonly image?: MediaImage;
}

/** The editable part of a brand. Its name is a proper noun, so it is one string. */
export interface BrandDraft {
  readonly slug: string;
  readonly name: string;
  readonly description: LocalizedText;
  /** `undefined` (or `null` in a request body) is no logo; a body without the key keeps the current one. */
  readonly logo?: MediaImage;
}

export interface StockAdjustment {
  readonly productId: string;
  readonly variantId: string;
  /** Signed delta, not an absolute value: two staff adjusting at once must add up. */
  readonly delta: number;
  readonly reason: string;
}

export interface ProductSummaryMedia {
  readonly image?: MediaImage;
}
