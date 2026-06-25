/** Kluby rock/metal per miasto — używane w zapytaniach Discovery. */
export const CLUBS_BY_CITY_SLUG: Record<string, string[]> = {
  warszawa: ["Proxima", "Chmury", "Hydrozagadka", "Pogo", "Stodoła"],
  krakow: ["Alchemia", "Kwadrat", "Strefa", "Hype Park"],
  wroclaw: ["Odra-Fange", "Tęcza", "Vertigo", "Piekarnia"],
  poznan: ["U Bazyla", "Meskalina", "Progresja"],
  gdansk: ["B90", "Parapet", "Klub ACK"],
  katowice: ["MegaClub", "Królestwo"],
  lodz: ["Wytwórnia", "Diesel"],
  lublin: ["Graffiti"],
  szczecin: ["Alter Ego"],
  bydgoszcz: ["Mózg"],
  bialystok: ["K2"],
  rzeszow: ["Strefa Kultury"],
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
  /facebook\.com\/.*\/events/i,
  /fb\.com\/events/i,
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
