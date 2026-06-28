import type { SeedSource } from "./sources";

/**
 * Oficjalne strony festiwali rock/metal + listy festiwalowe u agregatorów.
 */
export const FESTIVAL_SOURCES: SeedSource[] = [
  {
    citySlug: "gdansk",
    url: "https://mysticfestival.pl/",
    type: "venue",
    platform: "Mystic Festival",
    trustScore: 0.95,
  },
  {
    citySlug: "poznan",
    url: "https://polandrockfestival.pl/",
    type: "venue",
    platform: "Pol'and'Rock",
    trustScore: 0.95,
  },
  {
    citySlug: "wroclaw",
    url: "https://www.metalmania.com.pl/",
    type: "venue",
    platform: "Metalmania",
    trustScore: 0.9,
  },
  {
    citySlug: "wroclaw",
    url: "https://castleparty.com/",
    type: "venue",
    platform: "Castle Party",
    trustScore: 0.9,
  },
  {
    citySlug: "poznan",
    url: "https://www.jarocinfestiwal.pl/",
    type: "venue",
    platform: "Jarocin",
    trustScore: 0.88,
  },
  {
    citySlug: "lublin",
    url: "https://innebrzmienia.eu/",
    type: "venue",
    platform: "Inne Brzmienia",
    trustScore: 0.9,
  },
  {
    citySlug: "katowice",
    url: "https://off-festival.pl/",
    type: "venue",
    platform: "OFF Festival",
    trustScore: 0.92,
  },
  {
    citySlug: "warszawa",
    url: "https://www.ebilet.pl/festiwale",
    type: "aggregator",
    platform: "eBilet Festiwale",
    trustScore: 0.92,
  },
  {
    citySlug: "warszawa",
    url: "https://goingapp.pl/festiwale",
    type: "aggregator",
    platform: "Going Festiwale",
    trustScore: 0.88,
  },
];
