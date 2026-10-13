import type { AdminProduct, AdminProductVariant, Brand, ProductCategory } from "@/features/catalogue";
import type { AuditInfo, Money } from "@/types";

import { hashSeed } from "../runtime";
import { storefrontImage, storefrontMedia } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";
import type { WebProductVariant } from "../website/types";

/**
 * The storefront's catalogue, as staff see it.
 *
 * Every product, category and brand comes from the website snapshot — same ids,
 * same copy in both languages — so a product opened here is the product the
 * site sells. What is added is what only the admin holds:
 *
 * - EXACT STOCK. The storefront shows a signal ("low stock"); the admin holds
 *   the count behind it. Counts are derived FROM the signal, so the two agree:
 *   a variant the site calls low is at or under its reserve here, and one the
 *   site calls out of stock has none on hand.
 * - COST PRICE, which never leaves the admin.
 * - AUDIT, which only the server may set.
 *
 * Pictures are the storefront's own (`media`, `logo`, `image`), made absolute
 * so the admin, on another origin, can show them.
 *
 * Counts are seeded by variant id, so they are the same on every reload.
 */
const audit = (createdAt: string, updatedAt: string): AuditInfo => ({
  createdAt,
  createdBy: "admin-1",
  updatedAt,
  updatedBy: "admin-3",
});

const scale = (value: Money, ratio: number): Money => ({
  amount: Math.round((value.amount * ratio) / 500) * 500,
  currency: value.currency,
});

function stockFromSignal(variant: WebProductVariant, threshold: number): number {
  const seed = hashSeed(variant.id);
  switch (variant.stockStatus) {
    case "in-stock":
      return threshold + 6 + (seed % 34);
    case "low-stock":
      return 1 + (seed % threshold);
    case "out-of-stock":
    case "pre-order":
      return 0;
  }
}

function toVariant(variant: WebProductVariant): AdminProductVariant {
  const threshold = 4 + (hashSeed(variant.sku) % 3) * 2;
  return {
    id: variant.id,
    sku: variant.sku,
    title: variant.title,
    selections: variant.selections,
    price: variant.price,
    compareAtPrice: variant.compareAt,
    costPrice: scale(variant.price, 0.56 + (hashSeed(variant.sku) % 10) / 100),
    stockOnHand: stockFromSignal(variant, threshold),
    lowStockThreshold: threshold,
    // A pre-order variant is still sold; nothing on the site is switched off.
    isActive: true,
  };
}

export const mockProducts: AdminProduct[] = websiteSnapshot.products.map((product) => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  summary: product.summary,
  description: product.description,
  // Everything the storefront lists is, by definition, published.
  status: "published",
  brandId: product.brandId,
  categoryIds: product.categoryIds,
  sportIds: product.sportIds,
  media: storefrontMedia(product.media),
  options: product.options,
  variants: product.variants.map(toVariant),
  rating: product.rating,
  audit: audit(product.publishedAt, product.publishedAt),
}));

const countWhere = (test: (product: AdminProduct) => boolean) => mockProducts.filter(test).length;

export const mockBrands: Brand[] = websiteSnapshot.brands.map((brand) => ({
  id: brand.id,
  slug: brand.slug,
  name: brand.name,
  description: brand.description,
  logo: storefrontImage(brand.logo),
  productCount: countWhere((product) => product.brandId === brand.id),
  audit: audit("2026-01-04", "2026-05-02"),
}));

export const mockProductCategories: ProductCategory[] = websiteSnapshot.productCategories.map(
  (category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    sportIds: category.sportIds,
    image: storefrontImage(category.image),
    productCount: countWhere((product) => product.categoryIds.includes(category.id)),
    audit: audit("2026-01-04", "2026-04-09"),
  }),
);
