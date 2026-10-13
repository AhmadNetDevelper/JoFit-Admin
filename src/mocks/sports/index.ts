import type { Sport } from "@/features/sports";

import { storefrontImage } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";

/** The storefront's taxonomy, verbatim — every other fixture references these ids. */
export const mockSports: Sport[] = websiteSnapshot.sports.map((sport) => {
  const image = storefrontImage(sport.image);
  return {
    id: sport.id,
    slug: sport.slug,
    name: sport.name,
    isFeatured: sport.isFeatured,
    ...(image ? { image } : {}),
  };
});
