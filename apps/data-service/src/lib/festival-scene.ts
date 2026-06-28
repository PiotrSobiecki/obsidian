const FESTIVAL_URL_PATTERNS = [
  /festiwal/i,
  /festival/i,
  /mysticfestival/i,
  /polandrock/i,
  /metalmania/i,
  /castleparty/i,
  /jarocin/i,
  /innebrzmienia/i,
  /off-festival/i,
  /hellsbells/i,
  /ebilet\.pl\/festiwal/i,
  /goingapp\.pl\/festiwal/i,
];

const ROCK_METAL_FESTIVALS = [
  "Mystic Festival",
  "Pol'and'Rock",
  "Metalmania",
  "Castle Party",
  "Jarocin",
  "Inne Brzmienia",
  "OFF Festival",
  "Hells Bells Festival",
  "Hells Bells",
  "Full Metal Mountain",
  "Rock Fest",
];

export function isFestivalSourceUrl(url: string): boolean {
  return FESTIVAL_URL_PATTERNS.some((re) => re.test(url));
}

export function isFestivalEvent(title: string, venueName = ""): boolean {
  const text = `${title} ${venueName}`.toLowerCase();
  if (/\bfestiwal\b|\bfestival\b/.test(text)) return true;
  return ROCK_METAL_FESTIVALS.some((name) => text.includes(name.toLowerCase()));
}

/** Klucz festiwalu do deduplikacji („OFF Festival 2026 Katowice” → off festival). */
export function normalizeFestivalKey(title: string): string | null {
  const t = title.toLowerCase();
  for (const name of ROCK_METAL_FESTIVALS) {
    if (t.includes(name.toLowerCase())) return name.toLowerCase();
  }
  if (/\boff\s*festival\b/.test(t)) return "off festival";
  if (/\binne\s*brzmienia\b/.test(t)) return "inne brzmienia";
  if (/\bwsch[oó]d\s*kultury\b/.test(t)) return "inne brzmienia";
  if (/\bhells\s*bells\b/.test(t)) return "hells bells";
  return null;
}

export function festivalsLikelySameEvent(a: string, b: string): boolean {
  const ka = normalizeFestivalKey(a);
  const kb = normalizeFestivalKey(b);
  return !!(ka && kb && ka === kb);
}

/** Fałszywe listingi OFF z agregatorów (mylone z Open'er / halucynacje LLM). */
export function isSuspiciousOffFestivalListing(
  title: string,
  artists: string[] = []
): boolean {
  const text = `${title} ${artists.join(" ")}`.toLowerCase();
  if (!/\boff\s*festival\b/.test(text)) return false;
  return /\b(iggy\s*pop|massive\s*attack|sigur\s*r[oó]s|aphex\s*twin|kraftwerk|the\s*xx|caribou|animal\s*collective)\b/.test(
    text
  );
}

/** Oficjalna strona festiwalu > eBilet > Going > reszta. */
export function preferFestivalTicketUrl(
  current: string | null | undefined,
  incoming: string | null | undefined
): string | null | undefined {
  const score = (url: string | null | undefined): number => {
    if (!url) return 0;
    const u = url.toLowerCase();
    if (/off-festival\.pl|innebrzmienia\.eu|castleparty\.|mysticfestival\.|polandrock|metalmania|jarocin|hellsbells\.pl/i.test(u)) {
      return 100;
    }
    if (/ebilet\.pl/i.test(u)) return 50;
    if (/goingapp\.pl|going\.pl/i.test(u)) return 30;
    if (/biletomat\.pl|ticketmaster/i.test(u)) return 40;
    return 10;
  };
  const a = score(current);
  const b = score(incoming);
  if (b > a) return incoming ?? current;
  return current ?? incoming;
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export { ROCK_METAL_FESTIVALS };
