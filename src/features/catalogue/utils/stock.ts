import type { AdminProduct } from "../types";

export function totalStock(product: AdminProduct): number {
  return product.variants.reduce((total, variant) => total + variant.stockOnHand, 0);
}

export function hasLowStock(product: AdminProduct): boolean {
  return product.variants.some((variant) => variant.stockOnHand <= variant.lowStockThreshold);
}

/** Lowest active variant price, used as the "from" price in listings. */
export function lowestVariantPrice(product: AdminProduct) {
  return product.variants.reduce<AdminProduct["variants"][number] | undefined>(
    (lowest, variant) => (!lowest || variant.price.amount < lowest.price.amount ? variant : lowest),
    undefined,
  )?.price;
}
