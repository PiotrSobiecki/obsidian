import { normalizeVenueName } from "./event-quality";

/** Kluby rock/metal per miasto — używane w zapytaniach Discovery. */
export const CLUBS_BY_CITY_SLUG: Record<string, string[]> = {
  warszawa: [
    "Proxima",
    "Progresja",
    "Hydrozagadka",
    "Pogo",
    "Chmury",
    "Stodoła",
    "VooDoo Club",
    "Skład Butelek",
    "Hybrydy",
  ],
  krakow: [
    "Alchemia",
    "Kwadrat",
    "Hype Park",
    "Zaścianek",
    "Fabryka",
    "Szpitalna 1",
    "Strefa",
  ],
  wroclaw: [
    "Vertigo",
    "Stary Klasztor",
    "Firlej",
    "Liverpool",
    "Łącznik",
    "Odra-Fange",
    "Tęcza",
  ],
  poznan: [
    "Meskalina",
    "U Bazyla",
    "Pod Minogą",
    "Tama",
    "Las Klub",
    "Progresja",
  ],
  gdansk: [
    "B90",
    "Drizzly Grizzly",
    "Protokultura",
    "Klub Żak",
    "Parlament",
    "Ucho",
  ],
  katowice: [
    "Królestwo",
    "Mega Club",
    "Leśniczówka",
    "P23",
    "Hipnoza",
  ],
  lodz: [
    "Wytwórnia",
    "DOM",
    "Magnetofon",
    "Bagdad Cafe",
    "Scenografia",
    "Diesel",
  ],
  lublin: ["Graffiti", "Koyot", "Centrala", "Scena Prapremier"],
  szczecin: ["Alter Ego", "Domek Grabarza", "Stara Rzeźnia"],
  bydgoszcz: ["Mózg", "Estrada", "Kuźnia"],
  bialystok: ["K2", "Zmiana Klimatu", "Gwint"],
  rzeszow: ["Strefa Kultury", "Vinyl Club", "Pod Palmą"],
  gdynia: ["Ucho", "Desdemona", "Atelier"],
  torun: ["Od Nowa", "Lizard King", "NRD", "Dwa Światy"],
  czestochowa: ["Klub Hendrix", "Paka"],
  sosnowiec: ["Maszynownia", "Remont"],
  gliwice: ["Spichlerz", "Drugie Dno"],
  zabrze: ["CK Wiatrak", "Klub Mod"],
  olsztyn: ["Andergrant", "Zgrzyt"],
  opole: ["Maszyna Trans", "NieMA"],
  kielce: ["Pańska Skórka", "Studenckie Centrum Kultury"],
  radom: ["Strefa G2"],
  tarnow: ["Pod Murami"],
  koszalin: ["Atmosfera"],
  legnica: ["Spiżarnia"],
  "jelenia-gora": ["Klub Kwadrat"],
  walbrzych: ["Stara Kopalnia"],
  slupsk: ["Akademickie Centrum Kultury"],
  "nowy-sacz": ["Maska"],
};

const CLUB_URL_PATTERNS = [
  /proxima/i,
  /klubproxima/i,
  /chmury/i,
  /goingapp\.pl\/miejsce/i,
  /goingapp\.pl\/festiwal/i,
  /mysticfestival/i,
  /polandrock/i,
  /metalmania/i,
  /castleparty/i,
  /jarocin/i,
  /hydrozagadka/i,
  /pogoclub/i,
  /alchemia\.com/i,
  /kwadrat\.com/i,
  /strefa\.info/i,
  /odra-fange/i,
  /klubtecza/i,
  /ubazyla/i,
  /meskalina/i,
  /b90\.pl/i,
  /megaclub/i,
  /wytwornia\.com/i,
  /dieselclub/i,
  /graffiti\.lublin/i,
  /alterego\.szczecin/i,
];

export function isLikelyClubSourceUrl(url: string): boolean {
  return CLUB_URL_PATTERNS.some((re) => re.test(url));
}

/** Nazwy typowych małych sal — sygnał dla heurystyk (nie filtr wielkości). */
export const SMALL_VENUE_KEYWORDS = [
  "klub",
  "club",
  "pub",
  "bar",
  "chmury",
  "proxima",
  "alchemia",
  "bazyla",
  "meskalina",
  "odra",
  "fange",
  "b90",
  "megaclub",
  "graffiti",
  "diesel",
  "wytwórnia",
  "wytwornia",
  "underground",
  "rehearsal",
  "progresja",
];

export function looksLikeSmallClubVenue(venueName: string): boolean {
  const lower = venueName.toLowerCase();
  return SMALL_VENUE_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Nazwa sali (lower) → slugi miast, w których występuje w naszej scenie. */
const VENUE_TO_CITY_SLUGS = new Map<string, string[]>();

for (const [citySlug, clubs] of Object.entries(CLUBS_BY_CITY_SLUG)) {
  for (const club of clubs) {
    const key = normalizeVenueName(club).toLowerCase();
    const list = VENUE_TO_CITY_SLUGS.get(key) ?? [];
    if (!list.includes(citySlug)) list.push(citySlug);
    VENUE_TO_CITY_SLUGS.set(key, list);
  }
}

export type CityRef = { id: string; slug: string };

/**
 * Dla znanych sal (np. Progresja w Warszawie i Poznaniu) — jeśli źródło jest
 * przypięte do miasta, w którym ta sala występuje, ufamy kotwicy źródła.
 */
export function resolveCityIdForKnownVenue(
  venueName: string | null | undefined,
  sourceCity: CityRef,
  allCities: CityRef[]
): string | undefined {
  if (!venueName) return undefined;
  const key = normalizeVenueName(venueName).toLowerCase();
  const slugs = VENUE_TO_CITY_SLUGS.get(key);
  if (!slugs?.length) return undefined;

  if (slugs.includes(sourceCity.slug)) {
    return sourceCity.id;
  }
  if (slugs.length === 1) {
    return allCities.find((c) => c.slug === slugs[0])?.id;
  }
  return undefined;
}
