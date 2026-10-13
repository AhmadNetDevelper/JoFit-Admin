import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import {
  AppError,
  galleryProblem,
  imageProblem,
  localize,
  nowIso,
  notFound,
  paginate,
  storedGallery,
  storedImage,
  validationFailed,
} from "@/lib";
import { pushCatalogueImages } from "@/mocks/bridge";
import { mockBrands, mockProductCategories, mockProducts } from "@/mocks/catalogue";
import { mockOrders } from "@/mocks/orders";
import { localizedValues, matchesAny, matchesText, nextId, simulateLatency, sortRows } from "@/mocks/runtime";
import type { AuditInfo, ListQuery, MediaImage, PartialLocalizedText } from "@/types";

import {
  PRODUCT_MEDIA_MAX,
  type AdminProduct,
  type Brand,
  type BrandDraft,
  type NewProductDraft,
  type ProductCategory,
  type ProductCategoryDraft,
  type ProductDraft,
  type ProductListQuery,
  type ProductSortField,
} from "../types";
import { totalStock } from "../utils/stock";
import type { CatalogueService } from "./catalogue.contract";

function requireProduct(id: string): { product: AdminProduct; index: number } {
  const index = mockProducts.findIndex((entry) => entry.id === id);
  const product = mockProducts[index];
  if (!product) throw notFound(`Product "${id}"`);
  return { product, index };
}

function lowestPrice(product: AdminProduct): number {
  return product.variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.price.amount),
    Number.MAX_SAFE_INTEGER,
  );
}

function isLowStock(product: AdminProduct): boolean {
  return product.variants.some((variant) => variant.stockOnHand <= variant.lowStockThreshold);
}

function applyFilters(query: ProductListQuery): AdminProduct[] {
  return mockProducts.filter((product) => {
    // Search matches either language, so Arabic-speaking staff can find a record
    // by its English title and vice versa.
    const searchable = [
      ...localizedValues(product.title),
      ...localizedValues(product.summary),
      ...product.variants.map((variant) => variant.sku),
    ];
    if (!matchesText(searchable, query.search)) return false;
    if (query.statuses?.length && !query.statuses.includes(product.status)) return false;
    if (!matchesAny([...product.categoryIds], query.categoryIds)) return false;
    if (query.brandIds?.length && !query.brandIds.includes(product.brandId)) return false;
    if (!matchesAny([...product.sportIds], query.sportIds)) return false;
    if (query.lowStockOnly && !isLowStock(product)) return false;
    return true;
  });
}

function selectSortValue(
  product: AdminProduct,
  field: ProductSortField,
  locale: Locale,
): unknown {
  switch (field) {
    case "title":
      // Sorted in the language the list is being read in.
      return localize(product.title, locale);
    case "status":
      return product.status;
    case "stock":
      return totalStock(product);
    case "price":
      return lowestPrice(product);
    case "updatedAt":
      return product.audit.updatedAt;
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = "Lower-case letters, numbers and hyphens, e.g. running-shoes.";

/** Trimmed text in one language; tolerant of a request body that left the field out. */
const textIn = (value: PartialLocalizedText | undefined, locale: Locale) => (value?.[locale] ?? "").trim();

/** Only the languages that were written — an empty description is no description. */
function writtenText(value: PartialLocalizedText | undefined): PartialLocalizedText | undefined {
  const entries = LOCALES.map((locale) => [locale, textIn(value, locale)] as const).filter(
    ([, text]) => text !== "",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function created(): AuditInfo {
  const at = nowIso();
  return { createdAt: at, createdBy: "staff", updatedAt: at, updatedBy: "staff" };
}
const touched = (audit: AuditInfo): AuditInfo => ({ ...audit, updatedAt: nowIso(), updatedBy: "staff" });

/** A readable id from the slug, with a short random part only when the readable one is taken. */
function freshId(prefix: string, slug: string, taken: readonly { readonly id: string }[]): string {
  const readable = `${prefix}-${slug}`;
  return taken.some((row) => row.id === readable) ? nextId(readable) : readable;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");

/* ------------------------------------------------------------------ images */

/*
 * An image on a record is a value the upload returned (`mediaService`). The
 * checks are the shared ones (`@/lib` media-rules) — the rules the API
 * enforces — and a record's save never sees a file.
 */

/** Field errors for a single optional image under `key`. `null`/`undefined` is no image, which is allowed. */
function singleImageErrors(value: unknown, key: string): Record<string, string> {
  const problem = imageProblem(value);
  return problem ? { [key]: problem } : {};
}

/**
 * The next value of a single image field: a body without the key keeps the
 * current image; `null` (or `undefined`, from the admin's own draft) clears it.
 * Call after validating.
 */
function nextImage(draft: object, key: string, current: MediaImage | undefined): MediaImage | undefined {
  if (!(key in draft)) return current;
  const value = (draft as Record<string, unknown>)[key];
  return value ? storedImage(value as MediaImage) : undefined;
}

/** Field errors for a product gallery: a list of at most 12 stored images (or kept videos), none twice. */
function galleryErrors(value: unknown): Record<string, string> {
  const problem = galleryProblem(value, PRODUCT_MEDIA_MAX);
  return problem ? { media: problem } : {};
}

/**
 * One page of a small taxonomy, the way every admin collection answers:
 * `search` over the given texts plus the slug, case-insensitive; sorted by
 * name in the requested locale — Arabic collation for Arabic staff — unless
 * the query sorts by the slug, the product count or the last update.
 */
function taxonomyPage<TRow extends { readonly slug: string; readonly productCount: number; readonly audit: AuditInfo }>(
  rows: readonly TRow[],
  query: ListQuery,
  name: (row: TRow, locale: Locale) => string,
  searchable: (row: TRow) => readonly (string | undefined)[],
) {
  const locale = query.locale ?? DEFAULT_LOCALE;
  const found = rows.filter((row) => matchesText([...searchable(row), row.slug], query.search));
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const byName = [...found].sort((a, b) => collator.compare(name(a, locale), name(b, locale)));
  const field = query.sort?.field;
  const direction = query.sort?.direction ?? "asc";
  const sorted =
    field === "slug" || field === "productCount" || field === "updatedAt"
      ? sortRows(byName, (row) => (field === "updatedAt" ? row.audit.updatedAt : row[field]), direction)
      : direction === "desc"
        ? byName.reverse()
        : byName;
  return paginate(sorted, query);
}

/**
 * Server-side validation, simulated. It lives in the service — not in the form —
 * because the real backend will own these rules and the UI must be able to
 * render whatever it returns.
 */
function draftErrors(draft: ProductDraft): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  // A DRAFT only needs the default language, so staff can capture a product
  // quickly and translate later. PUBLISHING requires every language — that is
  // what stops a half-translated product reaching the public storefront.
  const required: readonly Locale[] = draft.status === "published" ? LOCALES : [DEFAULT_LOCALE];

  for (const locale of required) {
    if (textIn(draft.title, locale).length < 3) {
      fieldErrors[`title.${locale}`] = "Title must be at least 3 characters.";
    }
    if (textIn(draft.summary, locale) === "") {
      fieldErrors[`summary.${locale}`] = "Summary is required.";
    }
    if (draft.status === "published" && textIn(draft.description, locale) === "") {
      fieldErrors[`description.${locale}`] = "A published product needs a description.";
    }
  }

  if (!draft.brandId) {
    fieldErrors.brandId = "Choose a brand.";
  } else if (!mockBrands.some((brand) => brand.id === draft.brandId)) {
    fieldErrors.brandId = "That brand no longer exists.";
  }
  if (!draft.categoryIds?.length) {
    fieldErrors.categoryIds = "Choose at least one category.";
  } else if (draft.categoryIds.some((id) => !mockProductCategories.some((category) => category.id === id))) {
    fieldErrors.categoryIds = "One of the chosen categories no longer exists.";
  }
  Object.assign(fieldErrors, galleryErrors(draft.media));
  return fieldErrors;
}

function validateDraft(draft: ProductDraft): void {
  const fieldErrors = draftErrors(draft);
  if (Object.keys(fieldErrors).length > 0) {
    throw validationFailed(fieldErrors);
  }
}

/**
 * A new product is held to more than an edit: its title in every language
 * from the start (its address is built from it and both storefronts list it),
 * and a first variant that can actually be sold — a unique SKU and a price.
 */
function validateNewProduct(draft: NewProductDraft): void {
  /* Title first, so the error summary reads in the form's order. */
  const fieldErrors: Record<string, string> = {};
  for (const locale of LOCALES) {
    if (textIn(draft.title, locale).length < 3) {
      fieldErrors[`title.${locale}`] = "Title must be at least 3 characters.";
    }
  }
  Object.assign(fieldErrors, draftErrors(draft));

  const sku = (draft.variant?.sku ?? "").trim();
  if (sku === "") {
    fieldErrors["variant.sku"] = "Required.";
  } else if (
    mockProducts.some((product) =>
      product.variants.some((variant) => variant.sku.toLowerCase() === sku.toLowerCase()),
    )
  ) {
    fieldErrors["variant.sku"] = "Another product already uses this SKU.";
  }
  const amount = draft.variant?.price?.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    fieldErrors["variant.price"] = "Enter a price above zero.";
  }
  const stock = draft.variant?.stockOnHand;
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    fieldErrors["variant.stockOnHand"] = "Opening stock is a whole number, 0 or more.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw validationFailed(fieldErrors);
  }
}

/** Orders are history: a product anyone has bought stays, so those orders still read. */
function ordersContaining(productId: string): number {
  return mockOrders.filter((order) => order.lines.some((line) => line.productId === productId)).length;
}

/* -------------------------------------------------------------- categories */

/** Counted on every read, so adding or deleting a product moves the number. */
const withCategoryCount = (category: ProductCategory): ProductCategory => ({
  ...category,
  productCount: mockProducts.filter((product) => product.categoryIds.includes(category.id)).length,
});

/** Whether `candidateId` sits anywhere beneath `ancestorId`. */
function isBeneath(candidateId: string, ancestorId: string): boolean {
  const seen = new Set<string>();
  let current = mockProductCategories.find((category) => category.id === candidateId);
  while (current?.parentId && !seen.has(current.id)) {
    const parentId = current.parentId;
    if (parentId === ancestorId) return true;
    seen.add(current.id);
    current = mockProductCategories.find((category) => category.id === parentId);
  }
  return false;
}

/** Both names, a free well-formed slug and a parent that does not loop back. */
function validateCategory(draft: ProductCategoryDraft, id?: string): void {
  const errors: Record<string, string> = {};
  for (const locale of LOCALES) {
    if (textIn(draft.name, locale) === "") errors[`name.${locale}`] = "Required.";
  }
  if (!SLUG.test(draft.slug ?? "")) errors.slug = SLUG_MESSAGE;
  else if (mockProductCategories.some((category) => category.slug === draft.slug && category.id !== id)) {
    errors.slug = "Another category already uses this address.";
  }
  if (draft.parentId) {
    if (draft.parentId === id) errors.parentId = "A category cannot sit under itself.";
    else if (!mockProductCategories.some((category) => category.id === draft.parentId)) {
      errors.parentId = "That parent category no longer exists.";
    } else if (id && isBeneath(draft.parentId, id)) {
      errors.parentId = "That category sits under this one. Choose a different parent.";
    }
  }
  Object.assign(errors, singleImageErrors(draft.image, "image"));
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function requireCategory(id: string): { category: ProductCategory; index: number } {
  const index = mockProductCategories.findIndex((entry) => entry.id === id);
  const category = mockProductCategories[index];
  if (!category) throw notFound(`Category "${id}"`);
  return { category, index };
}

/* ------------------------------------------------------------------ brands */

const withBrandCount = (brand: Brand): Brand => ({
  ...brand,
  productCount: mockProducts.filter((product) => product.brandId === brand.id).length,
});

/** A name — one string, it is a proper noun — and a free, well-formed slug. */
function validateBrand(draft: BrandDraft, id?: string): void {
  const errors: Record<string, string> = {};
  if ((draft.name ?? "").trim() === "") errors.name = "Required.";
  if (!SLUG.test(draft.slug ?? "")) errors.slug = SLUG_MESSAGE;
  else if (mockBrands.some((brand) => brand.slug === draft.slug && brand.id !== id)) {
    errors.slug = "Another brand already uses this address.";
  }
  Object.assign(errors, singleImageErrors(draft.logo, "logo"));
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function requireBrand(id: string): { brand: Brand; index: number } {
  const index = mockBrands.findIndex((entry) => entry.id === id);
  const brand = mockBrands[index];
  if (!brand) throw notFound(`Brand "${id}"`);
  return { brand, index };
}

export const mockCatalogueService: CatalogueService = {
  async listProducts(query = {}) {
    await simulateLatency();
    const filtered = applyFilters(query);
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sorted = query.sort
      ? sortRows(
          filtered,
          (product) => selectSortValue(product, query.sort!.field, locale),
          query.sort.direction,
        )
      : filtered;
    return paginate(sorted, query);
  },

  async getProduct(id) {
    await simulateLatency();
    return mockProducts.find((product) => product.id === id) ?? null;
  },

  async createProduct(draft) {
    await simulateLatency();
    validateNewProduct(draft);
    /* The slug is the server's to choose, from the English title: a product's
       address has to stay put once shoppers have linked to it. */
    const base = slugify(draft.title.en) || "product";
    let slug = base;
    for (let n = 2; mockProducts.some((product) => product.slug === slug); n += 1) slug = `${base}-${n}`;
    const product: AdminProduct = {
      id: freshId("prod", slug, mockProducts),
      slug,
      title: draft.title,
      summary: draft.summary,
      description: draft.description,
      status: draft.status ?? "draft",
      brandId: draft.brandId,
      categoryIds: [...draft.categoryIds],
      sportIds: [...(draft.sportIds ?? [])],
      seo: draft.seo,
      media: storedGallery(draft.media ?? []),
      options: [],
      variants: [
        {
          id: `var-${slug}-default`,
          sku: draft.variant.sku.trim(),
          /* No options yet, so nothing to build a title from. */
          title: "Standard",
          selections: {},
          price: draft.variant.price,
          stockOnHand: draft.variant.stockOnHand,
          /* The reserve most of the fixtures carry. */
          lowStockThreshold: 4,
          isActive: true,
        },
      ],
      rating: { average: 0, count: 0 },
      audit: created(),
    };
    mockProducts.push(product);
    /* Pictures reach the storefront; the rest of the catalogue does not (`pushCatalogueImages`). */
    pushCatalogueImages("product", product.id, ["media"], undefined, product);
    return product;
  },

  async updateProduct(id, draft) {
    await simulateLatency();
    validateDraft(draft);
    const { product, index } = requireProduct(id);
    const updated: AdminProduct = {
      ...product,
      ...draft,
      /* A body without the gallery keeps it; `null` empties it. */
      media: draft.media === undefined ? product.media : storedGallery(draft.media ?? []),
      audit: { ...product.audit, updatedAt: nowIso(), updatedBy: "admin-3" },
    };
    mockProducts[index] = updated;
    pushCatalogueImages("product", id, ["media"], product, updated);
    return updated;
  },

  async setProductStatus(id, status) {
    await simulateLatency();
    const { product, index } = requireProduct(id);
    if (status === "published") {
      const untranslated = LOCALES.filter(
        (locale) => (product.description[locale] ?? "").trim() === "",
      );
      if (untranslated.length > 0) {
        throw validationFailed(
          Object.fromEntries(
            untranslated.map((locale) => [
              `description.${locale}`,
              "A published product needs a description in every language.",
            ]),
          ),
        );
      }
    }
    const updated: AdminProduct = {
      ...product,
      status,
      audit: { ...product.audit, updatedAt: nowIso(), updatedBy: "admin-3" },
    };
    mockProducts[index] = updated;
    return updated;
  },

  async adjustStock({ productId, variantId, delta, reason }) {
    await simulateLatency();
    if (reason.trim() === "") {
      throw validationFailed({ reason: "Give a reason for the adjustment." });
    }
    const { product, index } = requireProduct(productId);
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (!variant) throw notFound(`Variant "${variantId}"`);
    if (variant.stockOnHand + delta < 0) {
      throw validationFailed({ delta: "Stock cannot go below zero." });
    }

    const updated: AdminProduct = {
      ...product,
      variants: product.variants.map((entry) =>
        entry.id === variantId ? { ...entry, stockOnHand: entry.stockOnHand + delta } : entry,
      ),
      audit: { ...product.audit, updatedAt: nowIso(), updatedBy: "admin-3" },
    };
    mockProducts[index] = updated;
    return updated;
  },

  async deleteProduct(id) {
    await simulateLatency();
    const { index } = requireProduct(id);
    const orders = ordersContaining(id);
    if (orders > 0) {
      throw new AppError(
        "conflict",
        `This product is on ${plural(orders, "order")}. Orders are history, so it cannot be deleted — archive it instead.`,
        { status: 409 },
      );
    }
    mockProducts.splice(index, 1);
  },

  async listCategories() {
    await simulateLatency();
    return mockProductCategories.map(withCategoryCount);
  },

  async listCategoriesPage(query = {}) {
    await simulateLatency();
    return taxonomyPage(
      mockProductCategories.map(withCategoryCount),
      query,
      (category, locale) => localize(category.name, locale),
      (category) => localizedValues(category.name),
    );
  },

  async createCategory(draft) {
    await simulateLatency();
    validateCategory(draft);
    const category: ProductCategory = {
      id: freshId("cat", draft.slug, mockProductCategories),
      slug: draft.slug,
      name: { en: draft.name.en.trim(), ar: draft.name.ar.trim() },
      description: writtenText(draft.description),
      parentId: draft.parentId || null,
      sportIds: [...(draft.sportIds ?? [])],
      image: nextImage(draft, "image", undefined),
      productCount: 0,
      audit: created(),
    };
    mockProductCategories.push(category);
    pushCatalogueImages("product-category", category.id, ["image"], undefined, category);
    return category;
  },

  async updateCategory(id, draft) {
    await simulateLatency();
    const { category, index } = requireCategory(id);
    validateCategory(draft, id);
    const updated: ProductCategory = withCategoryCount({
      ...category,
      slug: draft.slug,
      name: { en: draft.name.en.trim(), ar: draft.name.ar.trim() },
      description: writtenText(draft.description),
      parentId: draft.parentId || null,
      /* The screen does not edit sports yet; a body without them keeps what is there. */
      sportIds: draft.sportIds ? [...draft.sportIds] : category.sportIds,
      image: nextImage(draft, "image", category.image),
      audit: touched(category.audit),
    });
    mockProductCategories[index] = updated;
    pushCatalogueImages("product-category", id, ["image"], category, updated);
    return updated;
  },

  async deleteCategory(id) {
    await simulateLatency();
    const { index } = requireCategory(id);
    const products = mockProducts.filter((product) => product.categoryIds.includes(id)).length;
    const children = mockProductCategories.filter((category) => category.parentId === id).length;
    if (products + children > 0) {
      const what = [
        products > 0 ? plural(products, "product") : "",
        children > 0 ? plural(children, "sub-category", "sub-categories") : "",
      ].filter(Boolean);
      const one = products + children === 1;
      throw new AppError(
        "conflict",
        `${what.join(" and ")} ${one ? "is" : "are"} filed under this category. Move ${one ? "it" : "them"} first.`,
        { status: 409 },
      );
    }
    mockProductCategories.splice(index, 1);
  },

  async listBrands() {
    await simulateLatency();
    return mockBrands.map(withBrandCount);
  },

  async listBrandsPage(query = {}) {
    await simulateLatency();
    /* A brand's name is a proper noun, the same in both languages. */
    return taxonomyPage(
      mockBrands.map(withBrandCount),
      query,
      (brand) => brand.name,
      (brand) => [brand.name],
    );
  },

  async createBrand(draft) {
    await simulateLatency();
    validateBrand(draft);
    const brand: Brand = {
      id: freshId("brand", draft.slug, mockBrands),
      slug: draft.slug,
      name: draft.name.trim(),
      description: writtenText(draft.description),
      logo: nextImage(draft, "logo", undefined),
      productCount: 0,
      audit: created(),
    };
    mockBrands.push(brand);
    pushCatalogueImages("brand", brand.id, ["logo"], undefined, brand);
    return brand;
  },

  async updateBrand(id, draft) {
    await simulateLatency();
    const { brand, index } = requireBrand(id);
    validateBrand(draft, id);
    const updated: Brand = withBrandCount({
      ...brand,
      slug: draft.slug,
      name: draft.name.trim(),
      description: writtenText(draft.description),
      logo: nextImage(draft, "logo", brand.logo),
      audit: touched(brand.audit),
    });
    mockBrands[index] = updated;
    pushCatalogueImages("brand", id, ["logo"], brand, updated);
    return updated;
  },

  async deleteBrand(id) {
    await simulateLatency();
    const { index } = requireBrand(id);
    const products = mockProducts.filter((product) => product.brandId === id).length;
    if (products > 0) {
      const one = products === 1;
      throw new AppError(
        "conflict",
        `${plural(products, "product")} ${one ? "carries" : "carry"} this brand. Move ${one ? "it" : "them"} to another brand first.`,
        { status: 409 },
      );
    }
    mockBrands.splice(index, 1);
  },
};
