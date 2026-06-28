import { CLUBS_BY_CITY_SLUG } from "./club-scene";
import type { CityGeoRow } from "./nearest-city";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/^klub\s+/, "")
    .trim();
}

/** Nazwa klubu → slug miasta (z CLUBS_BY_CITY_SLUG). */
const VENUE_TO_CITY_SLUG = (() => {
  const map = new Map<string, string>();
  for (const [slug, clubs] of Object.entries(CLUBS_BY_CITY_SLUG)) {
    for (const club of clubs) {
      map.set(norm(club), slug);
    }
  }
  return map;
})();

/** Znany klub rockowy → id miasta z bazy (np. Hydrozagadka → Warszawa). */
export function lookupVenueCityId(
  venueName: string | undefined,
  cities: CityGeoRow[]
): string | undefined {
  if (!venueName) return undefined;
  const hay = norm(venueName);
  if (!hay) return undefined;

  let matchedSlug: string | undefined;
  let bestLen = 0;

  for (const [club, slug] of VENUE_TO_CITY_SLUG) {
    if (hay.includes(club) || club.includes(hay)) {
      if (club.length > bestLen) {
        bestLen = club.length;
        matchedSlug = slug;
      }
    }
  }

  if (!matchedSlug) return undefined;
  return cities.find((c) => c.slug === matchedSlug)?.id;
}
