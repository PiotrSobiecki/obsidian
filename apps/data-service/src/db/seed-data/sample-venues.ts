export type SampleVenue = {
  citySlug: string;
  name: string;
  address: string;
};

/** Małe i średnie kluby — głównie pod rock/metal. */
export const SAMPLE_VENUES: SampleVenue[] = [
  { citySlug: "warszawa", name: "Proxima", address: "ul. Zbawiciela 2" },
  { citySlug: "warszawa", name: "Chmury", address: "ul. Wawelska 18" },
  { citySlug: "warszawa", name: "Hydrozagadka", address: "ul. 11 Listopada 22" },
  { citySlug: "warszawa", name: "Pogo", address: "ul. Nowogrodzka 18" },
  { citySlug: "warszawa", name: "Stodoła", address: "ul. Wilcza 29" },
  { citySlug: "krakow", name: "Kwadrat", address: "ul. Makowicka 4" },
  { citySlug: "krakow", name: "Alchemia", address: "ul. Estery 5" },
  { citySlug: "krakow", name: "Strefa", address: "ul. Półłanki 21" },
  { citySlug: "wroclaw", name: "Tęcza", address: "ul. Ruska 51" },
  { citySlug: "wroclaw", name: "Odra-Fange", address: "ul. Jedności Narodowej 194" },
  { citySlug: "wroclaw", name: "Vertigo", address: "ul. Ruska 46" },
  { citySlug: "poznan", name: "U Bazyla", address: "ul. Garbary 34" },
  { citySlug: "poznan", name: "Meskalina", address: "ul. Garbary 61" },
  { citySlug: "gdansk", name: "B90", address: "ul. Słowackiego 19" },
  { citySlug: "gdansk", name: "Parapet", address: "ul. Oliwska 86" },
  { citySlug: "katowice", name: "MegaClub", address: "ul. Mariacka 8" },
  { citySlug: "katowice", name: "Królestwo", address: "ul. Mariacka 15" },
  { citySlug: "lodz", name: "Wytwórnia", address: "ul. Łąkowa 29" },
  { citySlug: "lodz", name: "Diesel", address: "ul. Tuwima 17" },
  { citySlug: "lublin", name: "Graffiti", address: "ul. Olejna 9" },
  { citySlug: "szczecin", name: "Alter Ego", address: "ul. Niemcewicza 26" },
  { citySlug: "bydgoszcz", name: "Mózg", address: "ul. Gdańska 30" },
  { citySlug: "bialystok", name: "K2", address: "ul. Białostoczan 12" },
  { citySlug: "rzeszow", name: "Strefa Kultury", address: "ul. Podwisłocze 15" },
];
