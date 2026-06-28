import { isNationalListingUrl, isRockMetalGenreListingUrl } from "./genre-policy";
import { normalizeTitle } from "./fingerprint";
import {
  coordsFromText,
  findNearestCityId,
  matchLocalityByName,
  type CityGeoRow,
  type GeoPoint,
} from "./nearest-city";
import { lookupVenueCityId } from "./venue-city";

export type { CityGeoRow };

function cityToken(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** URL-e odkrywane przez Brave, które dają śmieci lub duplikują seedowane źródła. */
const DISCOURAGED_SOURCE_PATTERNS = [
  /rockmetal\.pl/i,
  /stage24\.pl/i,
  /ticketmaster\.pl\/(artist|venue)\//i,
  /naszemiasto\.pl/i,
  /interia\.pl/i,
];

const GENERIC_NAV_SLUGS = new Set([
  "koncerty",
  "koncert",
  "koncerty.html",
  "events",
  "kalendarz",
  "terminy",
  "index",
  "index.html",
]);

/**
 * Źródło ma URL per-miasto (eBilet, klub) — ufamy `source.cityId`.
 * Odkryte agregatory (rockmetal, stage24) wymagają miasta z treści wydarzenia.
 */
export function trustsSourceCityId(url: string, sourceType: string): boolean {
  if (isNationalListingUrl(url)) return false;
  if (sourceType === "venue" || sourceType === "social") return true;
  if (isRockMetalGenreListingUrl(url)) return true;
  if (/goingapp\.pl\/wydarzenia\/[a-z0-9-]+\/?$/i.test(url)) return true;
  if (/biletomat\.pl\/wydarzenia\/w\/[a-z0-9-]+\//i.test(url)) return true;
  if (/ebilet\.pl\/miasto\/[a-z0-9-]+\//i.test(url)) return true;
  return false;
}

export function isDiscouragedSourceUrl(url: string): boolean {
  return DISCOURAGED_SOURCE_PATTERNS.some((re) => re.test(url));
}

export function isJunkTitle(title: string): boolean {
  const t = title.trim();
  const n = cityToken(t);
  if (t.length < 3) return true;
  if (/^(kup bilety?|otwórz dodatkowe|bilety|zobacz|sprawdź|więcej|wybierz)\b/i.test(t)) {
    return true;
  }
  if (/^(kup bilety?|otworz dodatkowe|bilety|zobacz|sprawdz|wiecej|wybierz)\b/.test(n)) {
    return true;
  }
  // samo „28.06.2026” albo sama data/godzina
  if (/^[\d.\s:,/-]+$/.test(t)) return true;
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(t)) return true;
  if (/\.html?$/i.test(t)) return true;
  if (/^koncerty(\.html)?$/i.test(t)) return true;
  // rockmetal i podobne — tytuły stron, nie koncertów (z/bez polskich znaków)
  if (/terminy koncert/.test(n)) return true;
  if (/rockmetal\.pl/.test(n)) return true;
  if (/\s-\s*koncerty\s*-/.test(t)) return true;
  if (/\|\s*koncerty\s*w\s*polsce/i.test(t)) return true;
  if (/koncerty\s*\d{4}\s*\|/i.test(t)) return true;
  if (/^kup bilet\b/i.test(t)) return true;
  return false;
}

export function isJunkTicketUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("rockmetal.pl") ||
    u.includes("stage24.pl") ||
    /\/koncerty\/?(\?|$)/i.test(u)
  );
}

export function isJunkEvent(event: {
  title: string;
  ticketUrl?: string | null;
}): boolean {
  return isJunkTitle(event.title) || isJunkTicketUrl(event.ticketUrl);
}

export function isGenericNavigationPath(pathname: string): boolean {
  const base = pathname.split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
  return GENERIC_NAV_SLUGS.has(base);
}

export function normalizeVenueName(name: string): string {
  return name
    .trim()
    .replace(/^klub\s+/i, "")
    .replace(/\s+koncerty\s+\d{4}$/i, "")
    .replace(/\s*\|\s*koncerty.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type CityRow = { id: string; name: string; slug: string };

/** Wykrywa miasto z tytułu / sali / pola city (najdłuższe dopasowanie). */
export function detectCityInText(text: string, cities: CityRow[]): string | undefined {
  const hay = cityToken(text);
  let best: { id: string; len: number } | undefined;

  for (const city of cities) {
    const nameToken = cityToken(city.name);
    const slugToken = cityToken(city.slug.replace(/-/g, " "));
    for (const token of [nameToken, slugToken]) {
      if (token.length < 4) continue;
      if (!hay.includes(token)) continue;
      if (!best || token.length > best.len) {
        best = { id: city.id, len: token.length };
      }
    }
  }

  return best?.id;
}

export type ResolveCityOptions = {
  explicitCity?: string;
  geo?: GeoPoint;
};

/**
 * Przypisuje wydarzenie do obsługiwanego miasta:
 * 1) bezpośrednie dopasowanie nazwy w tekście,
 * 2) znana miejscowość (festiwal, mniejsze miasto) → najbliższe miasto z bazy,
 * 3) jawne współrzędne (np. z parsera TM).
 */
export function resolveEventCityId(
  text: string,
  cities: CityGeoRow[],
  options: ResolveCityOptions = {}
): string | undefined {
  const combined = `${text} ${options.explicitCity ?? ""}`.trim();

  const direct = detectCityInText(combined, cities);
  if (direct) return direct;

  const geo =
    options.geo ??
    coordsFromText(combined) ??
    (options.explicitCity ? matchLocalityByName(options.explicitCity) : undefined);

  if (geo && "lat" in geo) {
    return findNearestCityId({ lat: geo.lat, lng: geo.lng }, cities);
  }

  return undefined;
}

export type AssignCityInput = {
  title: string;
  venue_name?: string;
  city?: string;
  geo_lat?: number;
  geo_lng?: number;
};

/**
 * Przypisuje wydarzenie do miasta z naszej bazy:
 * 1) znany klub → miasto klubu,
 * 2) miasto/miejscowość w treści lub polu city → bezpośrednio lub najbliższe,
 * 3) fallback: miasto źródła (listing per-miasto).
 */
export function assignEventCityId(
  item: AssignCityInput,
  cities: CityGeoRow[],
  cityIdByToken: Map<string, string>,
  fallbackCityId: string,
  options: { isNational: boolean; trustsSource: boolean }
): string | undefined {
  const text = `${item.title} ${item.venue_name ?? ""}`.trim();
  const geo: GeoPoint | undefined =
    item.geo_lat != null && item.geo_lng != null
      ? { lat: item.geo_lat, lng: item.geo_lng }
      : undefined;

  const fromVenue = lookupVenueCityId(item.venue_name, cities);
  if (fromVenue) return fromVenue;

  if (options.isNational) {
    const token = item.city ? cityToken(item.city) : "";
    const fromToken = token ? cityIdByToken.get(token) : undefined;
    if (fromToken) return fromToken;
    return resolveEventCityId(text, cities, { explicitCity: item.city, geo });
  }

  const fromContent = resolveEventCityId(text, cities, {
    explicitCity: item.city,
    geo,
  });
  if (fromContent) return fromContent;

  if (options.trustsSource) return fallbackCityId;

  return undefined;
}

/** Rdzeń tytułu — nazwa artysty przed „|" lub sufiksem sali. */
export function extractEventCoreTitle(title: string): string {
  let t = title.split("|")[0]?.split("—")[0]?.trim() ?? title;
  t = t.replace(/\s+-\s+kup bilet.*$/i, "").trim();
  t = t.replace(/\s+koncerty\s+\d{4}$/i, "").trim();
  return normalizeTitle(t);
}

export function titlesLikelySameEvent(a: string, b: string): boolean {
  const coreA = extractEventCoreTitle(a);
  const coreB = extractEventCoreTitle(b);
  if (!coreA || !coreB) return false;
  if (coreA === coreB) return true;
  if (coreA.length >= 5 && coreB.length >= 5) {
    return coreA.includes(coreB) || coreB.includes(coreA);
  }
  return false;
}

export function venuesLikelySame(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const na = normalizeVenueName(a).toLowerCase();
  const nb = normalizeVenueName(b).toLowerCase();
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/** Krótszy, czystszy tytuł wygrywa przy scalaniu duplikatów. */
export function preferEventTitle(current: string, incoming: string): string {
  if (isJunkTitle(incoming) && !isJunkTitle(current)) return current;
  if (isJunkTitle(current) && !isJunkTitle(incoming)) return incoming;
  const coreA = extractEventCoreTitle(current);
  const coreB = extractEventCoreTitle(incoming);
  if (coreA.length > 0 && coreB.length > 0) {
    if (coreB.length < coreA.length && !isJunkTitle(incoming)) return incoming;
    if (coreA.length < coreB.length && !isJunkTitle(current)) return current;
  }
  return incoming.length < current.length ? incoming : current;
}
