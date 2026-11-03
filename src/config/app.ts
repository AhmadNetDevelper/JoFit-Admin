const PRODUCTION_STOREFRONT_URL = "https://www.jofit.net";

/**
 * A production build never links to a local address: a leftover
 * `VITE_STOREFRONT_URL=http://localhost:…` (from a dashboard variable or a
 * local env file) would otherwise ship and send staff to a dead page.
 */
function resolveStorefrontUrl(): string {
  const configured = import.meta.env.VITE_STOREFRONT_URL;
  if (import.meta.env.PROD) {
    return configured && !/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(configured) ? configured : PRODUCTION_STOREFRONT_URL;
  }
  return configured ?? "http://localhost:3000";
}

export const appConfig = {
  name: "JoFit Admin",
  /** Public storefront, linked to from admin detail screens. */
  storefrontUrl: resolveStorefrontUrl(),
  defaultCurrency: "JOD",
  defaultLocale: "en",
} as const;
