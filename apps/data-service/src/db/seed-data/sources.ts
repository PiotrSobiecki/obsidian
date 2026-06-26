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

// Biletomat ma per-miasto listing gatunkowy /wydarzenia/w/{miasto}/muzyka/rock
// (sprawdzone: filtruje po mieście; metal zwraca 404, ale "rock" obejmuje też
// doom/metal/punk). Dochodzą miasta spoza zestawu eBiletu, gdzie biletomat działa.
const BILETOMAT_CITIES = [
  ...EBILET_CITIES,
  "szczecin",
  "bydgoszcz",
  "lublin",
  "bialystok",
] as const;

function biletomatRockSource(citySlug: string): SeedSource {
  return {
    citySlug,
    url: `https://biletomat.pl/wydarzenia/w/${citySlug}/muzyka/rock`,
    type: "aggregator",
    platform: "Biletomat Rock",
    trustScore: 0.9,
  };
}

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
  ...BILETOMAT_CITIES.map((slug) => biletomatRockSource(slug)),
];
