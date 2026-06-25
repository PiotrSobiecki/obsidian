/**
 * Polityka gatunków Obsidian — rock, metal i pokrewne.
 * NIE ZMIENIAJ bez zgody: bez disco, ethno, popowych imprez itp.
 */

import { CLUBS_BY_CITY_SLUG, isLikelyClubSourceUrl, looksLikeSmallClubVenue } from "./club-scene";
import { ROCK_METAL_FESTIVALS } from "./festival-scene";

export const GENRE_POLICY = {
  include: [
    "rock",
    "metal",
    "heavy metal",
    "death metal",
    "black metal",
    "thrash",
    "doom",
    "hardcore",
    "punk",
    "hard rock",
    "alternative",
    "grunge",
    "stoner",
    "prog",
    "post-rock",
    "metalcore",
    "deathcore",
    "industrial",
    "gothic",
    "nu metal",
    "folk metal",
    "power metal",
    "symphonic metal",
    "psychodeliczny rock",
    "stoner rock",
    "sludge",
    "grindcore",
    "post-metal",
    "blackgaze",
    "dungeon synth",
    "festiwal",
    "festival",
  ],
  exclude: [
    "disco",
    "disco polo",
    "ethno",
    "folklor",
    "folk music",
    "world music",
    "reggae",
    "jazz",
    "blues",
    "klasyka",
    "chopin",
    "chopinowski",
    "opera",
    "musical",
    "kabaret",
    "stand-up",
    "komedia",
    "wesele",
    "andrzejki",
    "sylwester",
    "impreza taneczna",
    "techno",
    "house",
    "trance",
    "edm",
    "hip-hop",
    "rap",
    "r&b",
    "pop",
    "dziecięce",
    "balet",
    "muzeum",
    "zwiedzanie",
    "symfonia",
    "filharmonia",
  ],
} as const;

export const NICHE_SCENE_RULES = `PRIORITY: small club gigs, underground shows, local bands, support acts, release shows, battle of bands, rehearsal-room concerts.
Also include rock/metal FESTIVALS (multi-day outdoor/indoor): official festival pages and ticket listings for events like ${ROCK_METAL_FESTIVALS.slice(0, 5).join(", ")}, etc.
For festivals: use festival name as venue_name, first concert day as starts_at, lineup artists in artists array.
Do NOT focus only on arena tours and festival headliners — extract ALL matching listings from the page, including lesser-known artists.
Small venues (clubs, pubs, underground spaces under ~800 capacity) are as important as large halls.
Include events even when the artist is unknown if the listing is clearly rock/metal/punk/hardcore in a relevant venue or festival.`;

export function buildDiscoveryQueries(
  cityName: string,
  citySlug?: string
): string[] {
  const queries = [
    `koncerty klubowe rock metal ${cityName}`,
    `festiwal rock metal ${cityName} bilety`,
    `festiwal metal ${cityName} 2026`,
    `underground metal ${cityName} klub`,
    `hardcore punk ${cityName} koncert klub`,
    `lokalne zespoły rock metal ${cityName} koncert`,
    `koncerty rock ${cityName} mały klub`,
    `black metal death metal ${cityName} klub`,
    `rock festiwal Polska bilety ${cityName}`,
  ];

  const clubs = citySlug ? CLUBS_BY_CITY_SLUG[citySlug] : undefined;
  if (clubs) {
    for (const club of clubs.slice(0, 4)) {
      queries.push(`"${club}" koncerty ${cityName}`);
      queries.push(`site:facebook.com/events ${club} ${cityName}`);
    }
  }

  return queries;
}

/** @deprecated użyj buildDiscoveryQueries */
export const DISCOVERY_SEARCH_QUERIES = (cityName: string) =>
  buildDiscoveryQueries(cityName);

export const LLM_GENRE_RULES = `INCLUDE only: rock, metal and related subgenres (heavy, death, black, thrash, doom, hardcore, punk, hard rock, alternative, grunge, stoner, prog, post-rock, metalcore, industrial, gothic, folk metal, power metal, symphonic metal, sludge, grindcore, post-metal) AND rock/metal festivals (festiwale).

EXCLUDE entirely: disco, disco polo, ethno, folklor, world music, jazz, blues, classical, opera, musical, kabaret, stand-up, DJ/techno/house/trance/EDM, hip-hop, rap, R&B, mainstream pop, children's events, weddings, party nights. Folk metal and pagan metal are INCLUDED. Reject pop/ethno/disco festivals.

If genre is unclear but venue is clearly a rock/metal club or festival, include. If clearly a disco club or ethno festival, reject.

${NICHE_SCENE_RULES}`;

export function buildParseEventsPrompt(
  cityName: string,
  sourceType?: string,
  sourceUrl?: string
): string {
  const isFestivalSource =
    sourceUrl != null && /festiwal|festival|mysticfestival|polandrock|metalmania|castleparty|jarocin/i.test(sourceUrl);

  const sourceHint =
    isFestivalSource
      ? "Source is a festival page or festival ticket listing — extract every rock/metal festival and festival concert. Include multi-day festivals (use opening day). ALWAYS set ticket_url to the real purchase link (ebilet, eventim, going, ticketmaster, biletomat, or official festival shop)."
      : sourceType === "venue"
        ? "Source is a club/venue calendar — expect small gigs, local bands, support slots. Extract every rock/metal/punk listing, not only headliners. Set ticket_url when a buy link is visible."
        : sourceType === "aggregator"
          ? "Source is a ticket aggregator — scroll through the full list; include club gigs AND festivals. ALWAYS copy the exact href to the event/ticket page as ticket_url."
          : "";

  return `Extract concert and festival listings from HTML for ${cityName}, Poland.
${LLM_GENRE_RULES}
${sourceHint}

Return ONLY valid JSON array. Each item: title, artists (array), starts_at (ISO 8601), venue_name, ticket_url (REQUIRED when any buy/bilety link exists — full https URL), price_min, price_max.
Only future events (after today). If none match genre policy return [].`;
}

export function buildClassifySourcePrompt(cityName: string): string {
  return `Classify if URL is a concert event source for ${cityName}, Poland focused on rock/metal scene.
${LLM_GENRE_RULES}

Venue/club calendars (even small clubs with irregular schedules) are HIGH VALUE — type "venue", high trust if they list rock/metal gigs.
Facebook/Instagram event pages for clubs: type "social", has_event_calendar=true if events are listed.

Return ONLY JSON: { "url", "type": "ticketing|venue|social|aggregator", "platform", "trust_score": 0-1, "has_event_calendar": boolean, "rock_metal_focused": boolean }.
Reject: news, Wikipedia, generic blogs, disco/ethno/pop-only portals.
Set has_event_calendar=false only if there is truly no event listing. Small rock clubs with mixed genres still count as rock_metal_focused=true if they host rock/metal regularly.`;
}

const EXCLUDE_PATTERNS = GENRE_POLICY.exclude.map(
  (term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i")
);

const INCLUDE_PATTERNS = GENRE_POLICY.include.map(
  (term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i")
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bilet z kategorii rock/metal lub festiwalu na eBilet i podobnych. */
export function ticketUrlIndicatesRockMetal(url: string | undefined | null): boolean {
  if (!url) return false;
  return (
    /\/muzyka\/(rock|metal|hardcore|punk|alternative|industrial|gothic)\//i.test(url) ||
    /\/festiwal/i.test(url)
  );
}

/** Odrzuca bilety z oczywistych nie-rockowych kategorii (np. eBilet /klasyka/, /teatr/). */
export function ticketUrlMatchesGenrePolicy(url: string | undefined | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  if (
    /\/(klasyka|opera|teatr|musicale|musical|zwiedzanie|sport|dzieci|dziecko|stand-up|kabaret|wesele|imprezy|film|kino|muzea|komedia|dramat|tragedia)\//i.test(
      u
    )
  ) {
    return false;
  }
  if (
    /\/muzyka\/(pop|jazz|blues|hip-hop|rap|rnb|disco|techno|house|trance|edm|folk|world|elektroniczna|dance|country)\//i.test(
      u
    )
  ) {
    return false;
  }
  return true;
}

export type GenreMatchContext = {
  sourceType?: string;
  sourceUrl?: string;
  venueName?: string;
};

/** Heurystyka po parsowaniu — odrzuca false positive spoza rock/metal. */
export function matchesGenrePolicy(
  title: string,
  artists: string[] = [],
  ticketUrl?: string | null,
  context?: GenreMatchContext
): boolean {
  if (!ticketUrlMatchesGenrePolicy(ticketUrl)) {
    return false;
  }

  const text = `${title} ${artists.join(" ")}`.toLowerCase();
  const venueName = context?.venueName ?? "";
  const sourceType = context?.sourceType;
  const sourceUrl = context?.sourceUrl ?? "";
  const fromRockClub =
    looksLikeSmallClubVenue(venueName) || isLikelyClubSourceUrl(sourceUrl);

  if (EXCLUDE_PATTERNS.some((re) => re.test(text))) {
    return false;
  }

  // Kalendarz znanego klubu rockowego — przepuść (tytuł = nazwa zespołu)
  if (sourceType === "venue" && fromRockClub) {
    return !/\b(disco|techno|hip.?hop|andrzejki|sylwester|disco polo)\b/i.test(text);
  }

  if (looksLikeSmallClubVenue(venueName)) {
    return !/\b(disco|techno|hip.?hop|andrzejki|sylwester)\b/i.test(text);
  }

  if (ticketUrl && ticketUrlIndicatesRockMetal(ticketUrl)) {
    return true;
  }

  if (INCLUDE_PATTERNS.some((re) => re.test(text))) {
    return true;
  }

  if (sourceType === "aggregator" || sourceType === "ticketing") {
    return false;
  }

  if (
    sourceType === "venue" &&
    /\b(koncert|live|gig|tour|support|festiwal|festival|fest|metal|rock|punk)\b/i.test(text) &&
    !/\b(dj|disco|techno|hip.?hop)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}
