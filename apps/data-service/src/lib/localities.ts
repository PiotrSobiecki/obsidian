/**
 * Miejscowości / lokalizacje festiwali spoza listy miast w filtrach UI.
 * Współrzędne → collector przypisuje wydarzenie do najbliższego obsługiwanego miasta.
 */
export type Locality = {
  name: string;
  tokens: string[];
  lat: number;
  lng: number;
};

export const KNOWN_LOCALITIES: Locality[] = [
  // Festiwale rock/metal
  { name: "Jarocin", tokens: ["jarocin"], lat: 51.9725, lng: 17.5014 },
  {
    name: "Kostrzyn nad Odrą",
    tokens: ["kostrzyn nad odra", "kostrzyn"],
    lat: 52.5877,
    lng: 14.6495,
  },
  { name: "Bolków", tokens: ["bolkow", "bolków"], lat: 50.922, lng: 16.1011 },
  { name: "Łężyca", tokens: ["lezyca", "łężyca"], lat: 51.8778, lng: 16.5744 },
  { name: "Orzysz", tokens: ["orzysz"], lat: 53.8097, lng: 21.9489 },
  { name: "Czaplinek", tokens: ["czaplinek"], lat: 53.5386, lng: 16.2333 },
  { name: "Węgorzewo", tokens: ["wegorzewo", "węgorzewo"], lat: 54.2147, lng: 21.7372 },
  { name: "Mikołajki", tokens: ["mikolajki", "mikołajki"], lat: 53.8028, lng: 21.5706 },
  { name: "Ostróda", tokens: ["ostroda", "ostróda"], lat: 53.6969, lng: 19.9649 },
  // Częste miejsca koncertów / sale poza dużymi miastami
  { name: "Żyrardów", tokens: ["zyrardow", "żyrardów"], lat: 52.048, lng: 20.4454 },
  { name: "Legionowo", tokens: ["legionowo"], lat: 52.3989, lng: 20.9261 },
  { name: "Pruszków", tokens: ["pruszkow", "pruszków"], lat: 52.1709, lng: 20.8122 },
  { name: "Otwock", tokens: ["otwock"], lat: 52.105, lng: 21.2617 },
  { name: "Piaseczno", tokens: ["piaseczno"], lat: 52.0814, lng: 21.0239 },
  { name: "Ostrów Wielkopolski", tokens: ["ostrow wielkopolski", "ostrów wielkopolski"], lat: 51.655, lng: 17.8069 },
  { name: "Leszno", tokens: ["leszno"], lat: 51.845, lng: 16.5749 },
  { name: "Kalisz", tokens: ["kalisz"], lat: 51.7617, lng: 18.091 },
  { name: "Konin", tokens: ["konin"], lat: 52.2231, lng: 18.2517 },
  { name: "Pabianice", tokens: ["pabianice"], lat: 51.6644, lng: 19.3547 },
  { name: "Zgierz", tokens: ["zgierz"], lat: 51.8556, lng: 19.4061 },
  { name: "Bełchatów", tokens: ["belchatow", "bełchatów"], lat: 51.3688, lng: 19.3567 },
  { name: "Stalowa Wola", tokens: ["stalowa wola"], lat: 50.5826, lng: 22.0534 },
  { name: "Puławy", tokens: ["pulawy", "puławy"], lat: 51.4165, lng: 21.9694 },
  { name: "Augustów", tokens: ["augustow", "augustów"], lat: 53.8437, lng: 22.9798 },
  { name: "Suwałki", tokens: ["suwalki", "suwałki"], lat: 54.1117, lng: 22.9309 },
  { name: "Ełk", tokens: ["elk", "ełk"], lat: 53.8285, lng: 22.3647 },
  { name: "Giżycko", tokens: ["gizycko", "giżycko"], lat: 54.038, lng: 21.7644 },
  { name: "Kołobrzeg", tokens: ["kolobrzeg", "kołobrzeg"], lat: 54.1759, lng: 15.5833 },
  { name: "Koszalin", tokens: ["koszalin"], lat: 54.1944, lng: 16.1722 },
  { name: "Słupsk", tokens: ["slupsk", "słupsk"], lat: 54.4641, lng: 17.0287 },
  { name: "Rumia", tokens: ["rumia"], lat: 54.5709, lng: 18.3881 },
  { name: "Wejherowo", tokens: ["wejherowo"], lat: 54.6057, lng: 18.2356 },
  { name: "Starogard Gdański", tokens: ["starogard gdanski", "starogard gdański"], lat: 53.9636, lng: 18.5264 },
  { name: "Tczew", tokens: ["tczew"], lat: 54.0924, lng: 18.7779 },
  { name: "Malbork", tokens: ["malbork"], lat: 54.0359, lng: 19.0266 },
  { name: "Chorzów", tokens: ["chorzow", "chorzów"], lat: 50.3058, lng: 18.9742 },
  { name: "Dąbrowa Górnicza", tokens: ["dabrowa gornicza", "dąbrowa górnicza"], lat: 50.321, lng: 19.1949 },
  { name: "Jaworzno", tokens: ["jaworzno"], lat: 50.2053, lng: 19.2749 },
  { name: "Bielsko-Biała", tokens: ["bielsko-biala", "bielsko-biała"], lat: 49.8224, lng: 19.0444 },
  { name: "Nowy Targ", tokens: ["nowy targ"], lat: 49.4775, lng: 20.0321 },
  { name: "Zakopane", tokens: ["zakopane"], lat: 49.2992, lng: 19.9496 },
  { name: "Krosno", tokens: ["krosno"], lat: 49.6885, lng: 21.7706 },
  { name: "Przemyśl", tokens: ["przemysl", "przemyśl"], lat: 49.7833, lng: 22.7677 },
  { name: "Tarnobrzeg", tokens: ["tarnobrzeg"], lat: 50.573, lng: 21.6795 },
  { name: "Mielec", tokens: ["mielec"], lat: 50.2871, lng: 21.4239 },
  { name: "Chełm", tokens: ["chelm", "chełm"], lat: 51.1431, lng: 23.4712 },
  { name: "Zamość", tokens: ["zamosc", "zamość"], lat: 50.7231, lng: 23.2519 },
  { name: "Świdnica", tokens: ["swidnica", "świdnica"], lat: 50.8425, lng: 16.4886 },
  { name: "Legnica", tokens: ["legnica"], lat: 51.207, lng: 16.1619 },
  { name: "Lubin", tokens: ["lubin"], lat: 51.401, lng: 16.2016 },
  { name: "Głogów", tokens: ["glogow", "głogów"], lat: 51.6634, lng: 16.0846 },
  { name: "Zielona Góra", tokens: ["zielona gora", "zielona góra"], lat: 51.9356, lng: 15.5062 },
  { name: "Gorzów Wielkopolski", tokens: ["gorzow wielkopolski", "gorzów wielkopolski"], lat: 52.7368, lng: 15.2288 },
  { name: "Świnoujście", tokens: ["swinoujscie", "świnoujście"], lat: 53.9105, lng: 14.2471 },
];
