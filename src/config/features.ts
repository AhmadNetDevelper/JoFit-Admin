/**
 * Domain switches. Several admin areas are architecturally prepared but not
 * functionally built; a flag lets their routes exist, and their code stay
 * compiled and type-checked, without pretending the feature is finished.
 */
export const featureFlags = {
  catalogue: true,
  rental: true,
  orders: true,
  customers: true,
  coaches: true,
  education: true,
  reviews: true,
  content: true,
  quotations: true,
  sports: true,
  lookups: true,
  identity: true,
  community: true,
  settings: true,
  menus: true,
  support: true,
  careers: true,
} as const;

export type FeatureKey = keyof typeof featureFlags;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return featureFlags[key];
}
