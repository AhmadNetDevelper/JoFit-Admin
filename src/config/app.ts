export const appConfig = {
  name: "JoFit Admin",
  /** Public storefront, linked to from admin detail screens. */
  storefrontUrl: import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:3000",
  defaultCurrency: "JOD",
  defaultLocale: "en",
} as const;
