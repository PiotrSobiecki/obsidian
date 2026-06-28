export const ALL_POLAND_CITY = { name: "Cała Polska", slug: "cala-polska" } as const;

export const POLISH_CITIES = [
  { name: "Warszawa", slug: "warszawa" },
  { name: "Kraków", slug: "krakow" },
  { name: "Wrocław", slug: "wroclaw" },
  { name: "Łódź", slug: "lodz" },
  { name: "Poznań", slug: "poznan" },
  { name: "Gdańsk", slug: "gdansk" },
  { name: "Szczecin", slug: "szczecin" },
  { name: "Bydgoszcz", slug: "bydgoszcz" },
  { name: "Lublin", slug: "lublin" },
  { name: "Białystok", slug: "bialystok" },
  { name: "Katowice", slug: "katowice" },
  { name: "Gdynia", slug: "gdynia" },
  { name: "Częstochowa", slug: "czestochowa" },
  { name: "Radom", slug: "radom" },
  { name: "Toruń", slug: "torun" },
  { name: "Kielce", slug: "kielce" },
  { name: "Gliwice", slug: "gliwice" },
  { name: "Zabrze", slug: "zabrze" },
  { name: "Olsztyn", slug: "olsztyn" },
  { name: "Rzeszów", slug: "rzeszow" },
  { name: "Opole", slug: "opole" },
  { name: "Koszalin", slug: "koszalin" },
  { name: "Słupsk", slug: "slupsk" },
  { name: "Nowy Sącz", slug: "nowy-sacz" },
  { name: "Jelenia Góra", slug: "jelenia-gora" },
] as const;

export type CitySlug = (typeof POLISH_CITIES)[number]["slug"];
