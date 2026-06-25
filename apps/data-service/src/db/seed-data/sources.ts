export type SeedSource = {
  citySlug: string;
  url: string;
  type: "ticketing" | "venue" | "social" | "aggregator";
  platform: string;
  trustScore: number;
};

const EBILET_CITIES = [
  "warszawa",
  "krakow",
  "wroclaw",
  "poznan",
  "lodz",
  "gdansk",
  "katowice",
] as const;

const GOING_CITIES = [...EBILET_CITIES] as const;

function ebiletRockMetalSources(citySlug: string): SeedSource[] {
  return [
    {
      citySlug,
      url: `https://www.ebilet.pl/miasto/${citySlug}/muzyka/rock`,
      type: "aggregator",
      platform: "eBilet Rock",
      trustScore: 0.96,
    },
    {
      citySlug,
      url: `https://www.ebilet.pl/miasto/${citySlug}/muzyka/metal`,
      type: "aggregator",
      platform: "eBilet Metal",
      trustScore: 0.96,
    },
  ];
}

function goingSource(citySlug: string): SeedSource {
  return {
    citySlug,
    url: `https://goingapp.pl/wydarzenia/${citySlug}`,
    type: "aggregator",
    platform: "Going",
    trustScore: 0.88,
  };
}

/** Agregatory biletowe — tylko rock/metal (nie /miasto/ bez filtra gatunku). */
export const SEED_SOURCES: SeedSource[] = [
  ...EBILET_CITIES.flatMap((slug) => ebiletRockMetalSources(slug)),
  ...GOING_CITIES.map((slug) => goingSource(slug)),
];
