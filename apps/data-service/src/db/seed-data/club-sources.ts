import type { SeedSource } from "./sources";

/**
 * Kalendarze klubów rock/metal — Discovery Agent uzupełnia przez Brave Search.
 * Collector parsuje te strony (heurystyka + LLM).
 */
export const CLUB_SOURCES: SeedSource[] = [
  // Warszawa — Going (SPA, wymaga browser binding)
  {
    citySlug: "warszawa",
    url: "https://goingapp.pl/miejsce/proxima",
    type: "venue",
    platform: "Proxima",
    trustScore: 0.9,
  },
  {
    citySlug: "warszawa",
    url: "https://goingapp.pl/miejsce/klubokawiarnia-chmury",
    type: "venue",
    platform: "Chmury",
    trustScore: 0.88,
  },
  {
    citySlug: "warszawa",
    url: "https://goingapp.pl/miejsce/hydrozagadka",
    type: "venue",
    platform: "Hydrozagadka",
    trustScore: 0.85,
  },
  // Kraków
  {
    citySlug: "krakow",
    url: "https://alchemia.com.pl/",
    type: "venue",
    platform: "Alchemia",
    trustScore: 0.92,
  },
  {
    citySlug: "krakow",
    url: "https://alchemia.com.pl/sklep/",
    type: "venue",
    platform: "Alchemia (bilety)",
    trustScore: 0.9,
  },
  // Gdańsk
  {
    citySlug: "gdansk",
    url: "https://b90.pl/",
    type: "venue",
    platform: "B90",
    trustScore: 0.92,
  },
  // Poznań
  {
    citySlug: "poznan",
    url: "https://ubazyla.pl/wydarzenia/",
    type: "venue",
    platform: "U Bazyla",
    trustScore: 0.9,
  },
  // Łódź
  {
    citySlug: "lodz",
    url: "https://wytwornia.com/pl/wydarzenia",
    type: "venue",
    platform: "Wytwórnia",
    trustScore: 0.85,
  },
];
