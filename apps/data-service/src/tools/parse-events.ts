import type { Ai } from "@cloudflare/workers-types";
import { WORKERS_AI_MODEL } from "../lib/ai-model";
import { isLikelyClubSourceUrl } from "../lib/club-scene";
import { isFestivalSourceUrl } from "../lib/festival-scene";
import {
  looksLikeTicketUrl,
  resolveTicketUrl,
  sanitizeTicketUrl,
} from "../lib/ticket-url";
import {
  buildClassifySourcePrompt,
  buildParseEventsPrompt,
  isNationalListingUrl,
  matchesGenrePolicy,
  type GenreMatchContext,
} from "../lib/genre-policy";
import { isDiscouragedSourceUrl, isJunkTitle } from "../lib/event-quality";
import { extractVenueEventsFromHtml } from "./extract-venue-events";
import { extractTicketmasterEvents } from "./extract-ticketmaster-events";

export { isJunkTitle };

export type ParsedEvent = {
  title: string;
  artists: string[];
  starts_at: string;
  venue_name: string;
  ticket_url?: string;
  price_min?: number;
  price_max?: number;
  /** Miasto wydarzenia — wypełniane tylko dla ogólnopolskich listingów (Ticketmaster). */
  city?: string;
};

export type ClassifiedSource = {
  url: string;
  type: "ticketing" | "venue" | "social" | "aggregator";
  platform: string;
  trust_score: number;
  has_event_calendar: boolean;
  rock_metal_focused?: boolean;
};

export type SourceContext = {
  cityName: string;
  sourceType?: string;
  sourceUrl?: string;
  /** Nazwa klubu z tabeli sources.platform */
  venueName?: string;
  /** Nazwy obsługiwanych miast — dla ogólnopolskich listingów (Ticketmaster). */
  cityNames?: string[];
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Biletomat (i część innych) oznacza koncerty jako TheaterEvent — też łapiemy.
const EVENT_JSONLD_TYPES = new Set([
  "Event",
  "MusicEvent",
  "Festival",
  "TheaterEvent",
]);

function isEventJsonLdType(type: unknown): boolean {
  if (typeof type === "string") return EVENT_JSONLD_TYPES.has(type);
  if (Array.isArray(type)) {
    return type.some((t) => typeof t === "string" && EVENT_JSONLD_TYPES.has(t));
  }
  return false;
}

function findTicketUrlNearTitle(
  html: string,
  title: string,
  baseUrl: string
): string | undefined {
  const words = title.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return undefined;

  const pattern = new RegExp(
    `.{0,250}${escapeRegex(words[0])}.{0,500}`,
    "i"
  );
  const chunk = html.match(pattern)?.[0];
  if (!chunk) return undefined;

  const hrefRe = /href=["']([^"']+)["'][^>]*>([^<]{0,80})/gi;
  for (const match of chunk.matchAll(hrefRe)) {
    const href = match[1];
    const label = match[2] ?? "";
    const resolved = resolveTicketUrl(href, baseUrl);
    if (!resolved) continue;
    if (
      looksLikeTicketUrl(resolved) ||
      /bilet|ticket|kup/i.test(label) ||
      /bilet|ticket|kup/i.test(href)
    ) {
      return resolved;
    }
  }

  return undefined;
}

function attachTicketUrls(
  events: ParsedEvent[],
  html: string | undefined,
  baseUrl: string | undefined
): ParsedEvent[] {
  if (!html || !baseUrl) return events;

  return events.map((event) => {
    const ticket_url =
      sanitizeTicketUrl(event.ticket_url, baseUrl) ??
      findTicketUrlNearTitle(html, event.title, baseUrl) ??
      undefined;

    return ticket_url ? { ...event, ticket_url } : event;
  });
}

function mergeUniqueEvents(
  primary: ParsedEvent[],
  secondary: ParsedEvent[]
): ParsedEvent[] {
  const seen = new Set(
    primary.map((e) => `${e.title}|${e.starts_at}|${e.venue_name}`.toLowerCase())
  );
  const merged = [...primary];

  for (const event of secondary) {
    const key = `${event.title}|${event.starts_at}|${event.venue_name}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(event);
    }
  }

  return merged;
}

function normalizeJsonLdEvent(
  raw: Record<string, unknown>,
  genreCtx?: GenreMatchContext
): ParsedEvent | null {
  const title =
    typeof raw.name === "string"
      ? raw.name
      : typeof raw.title === "string"
        ? raw.title
        : null;

  const startsAt =
    typeof raw.startDate === "string"
      ? raw.startDate
      : typeof raw.startTime === "string"
        ? raw.startTime
        : null;

  if (!title || !startsAt || Number.isNaN(Date.parse(startsAt))) {
    return null;
  }

  let venueName = "";
  const location = raw.location;
  if (typeof location === "object" && location !== null) {
    const loc = location as Record<string, unknown>;
    if (typeof loc.name === "string") venueName = loc.name;
  }

  const performers = raw.performer;
  const artists: string[] = [];
  if (Array.isArray(performers)) {
    for (const p of performers) {
      if (typeof p === "object" && p !== null && typeof (p as { name?: string }).name === "string") {
        artists.push((p as { name: string }).name);
      }
    }
  } else if (
    typeof performers === "object" &&
    performers !== null &&
    typeof (performers as { name?: string }).name === "string"
  ) {
    artists.push((performers as { name: string }).name);
  }

  const offers = raw.offers;
  let ticketUrl: string | undefined;
  if (typeof offers === "object" && offers !== null && typeof (offers as { url?: string }).url === "string") {
    ticketUrl = (offers as { url: string }).url;
  } else if (typeof raw.url === "string") {
    ticketUrl = raw.url;
  }

  const event: ParsedEvent = {
    title,
    artists,
    starts_at: startsAt,
    venue_name: venueName,
    ticket_url: ticketUrl ? sanitizeTicketUrl(ticketUrl) ?? undefined : undefined,
  };

  if (isJunkTitle(title)) return null;

  if (!matchesGenrePolicy(event.title, event.artists, ticketUrl, {
    ...genreCtx,
    venueName: venueName || genreCtx?.venueName,
  })) {
    return null;
  }

  return event;
}

export function normalizeCityToken(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function eventJsonMatchesCity(raw: Record<string, unknown>, cityName: string): boolean {
  const token = normalizeCityToken(cityName);
  const location = raw.location;
  if (typeof location !== "object" || location === null) return true;

  const loc = location as Record<string, unknown>;
  const localityParts: string[] = [];
  const addr = loc.address;
  if (typeof addr === "object" && addr !== null) {
    const a = addr as Record<string, unknown>;
    if (typeof a.addressLocality === "string") localityParts.push(a.addressLocality);
    if (typeof a.addressRegion === "string") localityParts.push(a.addressRegion);
  }

  // Brak rozpoznawalnego miasta w JSON-LD (np. Biletomat podaje tylko nazwę sali
  // i ulicę) — nie odrzucaj; źródło jest już per-miasto, ufamy jego cityId.
  if (localityParts.length === 0) return true;

  const hay = normalizeCityToken(localityParts.join(" "));
  return hay.includes(token) || token.includes(hay.split(",")[0]?.trim() ?? "");
}

function collectJsonLdEventNodes(node: unknown, out: Record<string, unknown>[]) {
  if (node == null) return;

  if (Array.isArray(node)) {
    for (const child of node) collectJsonLdEventNodes(child, out);
    return;
  }

  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];

  if (isEventJsonLdType(type)) {
    out.push(obj);
    return;
  }

  if (type === "ItemList" && Array.isArray(obj.itemListElement)) {
    for (const entry of obj.itemListElement) {
      if (typeof entry === "object" && entry !== null) {
        const item = (entry as Record<string, unknown>).item;
        if (item) collectJsonLdEventNodes(item, out);
      }
    }
  }

  if (Array.isArray(obj["@graph"])) {
    collectJsonLdEventNodes(obj["@graph"], out);
  }

  if (obj.item && typeof obj.item === "object") {
    collectJsonLdEventNodes(obj.item, out);
  }
}

export function extractJsonLdEvents(
  html: string,
  cityName?: string,
  genreCtx?: GenreMatchContext
): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const seen = new Set<string>();
  const scriptRe =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptRe)) {
    const jsonText = match[1]?.trim();
    if (!jsonText) continue;

    try {
      const data = JSON.parse(jsonText) as unknown;
      const rawEvents: Record<string, unknown>[] = [];
      collectJsonLdEventNodes(data, rawEvents);

      for (const obj of rawEvents) {
        if (cityName && !eventJsonMatchesCity(obj, cityName)) continue;
        const parsed = normalizeJsonLdEvent(obj, genreCtx);
        if (!parsed) continue;
        const key = `${parsed.title}|${parsed.starts_at}|${parsed.venue_name}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        events.push(parsed);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  return events;
}

export async function parseEventsFromHtml(
  ai: Ai,
  htmlSnippet: string,
  context: SourceContext | string,
  rawHtml?: string
): Promise<ParsedEvent[]> {
  const ctx: SourceContext =
    typeof context === "string" ? { cityName: context } : context;

  const genreCtx = {
    sourceType: ctx.sourceType,
    sourceUrl: ctx.sourceUrl,
  };

  const defaultVenue = ctx.venueName ?? "";

  const jsonLd = rawHtml
    ? extractJsonLdEvents(rawHtml, ctx.cityName, genreCtx)
        .map((e) => ({
          ...e,
          venue_name: e.venue_name || defaultVenue,
          ticket_url: sanitizeTicketUrl(e.ticket_url, ctx.sourceUrl) ?? e.ticket_url,
        }))
        .filter((e) =>
          matchesGenrePolicy(e.title, e.artists, e.ticket_url, {
            ...genreCtx,
            venueName: e.venue_name,
          })
        )
    : [];

  const venueHeuristic =
    rawHtml && ctx.sourceType === "venue" && ctx.sourceUrl
      ? extractVenueEventsFromHtml(rawHtml, defaultVenue, ctx.sourceUrl).filter(
          (e) =>
            !isJunkTitle(e.title) &&
            matchesGenrePolicy(e.title, e.artists, e.ticket_url, {
              ...genreCtx,
              venueName: e.venue_name,
            })
        )
      : [];

  // Ogólnopolski listing (Ticketmaster) — struktura jest regularna, więc bierzemy
  // go deterministycznym parserem zamiast zawodnego 8B (gubił SOAD/Judas i mylił
  // miasta). Jeśli parser coś znalazł, pomijamy LLM dla tego źródła.
  if (isNationalListingUrl(ctx.sourceUrl) && ctx.cityNames?.length) {
    const tm = extractTicketmasterEvents(htmlSnippet, ctx.cityNames).filter((e) =>
      matchesGenrePolicy(e.title, e.artists, e.ticket_url, {
        ...genreCtx,
        venueName: e.venue_name,
      })
    );
    if (tm.length > 0) {
      return attachTicketUrls(mergeUniqueEvents(jsonLd, tm), rawHtml, ctx.sourceUrl);
    }
  }

  // Listingi (agregator/ogólnopolski) mają wiele koncertów rozsianych po całej
  // stronie — jeden kawałek 8 KB gubił większość. Dzielimy oczyszczony tekst na
  // kawałki i odpytujemy model po kolei, scalając wyniki. Venue/kluby to małe
  // strony → wystarczy jeden kawałek.
  const chunkSize = ctx.sourceType === "venue" ? 12000 : 8000;
  const maxChunks = isNationalListingUrl(ctx.sourceUrl)
    ? 12
    : ctx.sourceType === "aggregator"
      ? 5
      : 1;

  const chunks: string[] = [];
  for (
    let offset = 0;
    offset < htmlSnippet.length && chunks.length < maxChunks;
    offset += chunkSize
  ) {
    chunks.push(htmlSnippet.slice(offset, offset + chunkSize));
  }
  if (chunks.length === 0) chunks.push("");

  const parsePromptContent = buildParseEventsPrompt(
    ctx.cityName,
    ctx.sourceType,
    ctx.sourceUrl
  );

  let llmEvents: ParsedEvent[] = [];
  for (const chunk of chunks) {
    try {
      const response = await ai.run(WORKERS_AI_MODEL, {
        messages: [
          { role: "system", content: parsePromptContent },
          { role: "user", content: chunk },
        ],
      });

      const text =
        typeof response === "object" && response !== null && "response" in response
          ? String((response as { response: string }).response)
          : String(response);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const chunkEvents = (JSON.parse(jsonMatch[0]) as ParsedEvent[]).filter(
        (e) =>
          e.title &&
          !isJunkTitle(e.title) &&
          e.starts_at &&
          !Number.isNaN(Date.parse(e.starts_at)) &&
          matchesGenrePolicy(e.title, e.artists ?? [], e.ticket_url, {
            sourceType: ctx.sourceType,
            sourceUrl: ctx.sourceUrl,
            venueName: e.venue_name || defaultVenue,
          })
      );
      llmEvents = mergeUniqueEvents(llmEvents, chunkEvents);
    } catch (error) {
      console.warn("[parse-events] LLM chunk failed, skipping:", error);
    }
  }

  if (llmEvents.length === 0 && jsonLd.length === 0 && venueHeuristic.length === 0) {
    return [];
  }

  const merged = mergeUniqueEvents(mergeUniqueEvents(jsonLd, venueHeuristic), llmEvents);
  return attachTicketUrls(merged, rawHtml, ctx.sourceUrl);
}

export function resolveSourceStatus(
  classified: ClassifiedSource,
  sourceUrl: string
): "active" | "pending_review" {
  if (isLikelyClubSourceUrl(sourceUrl) || classified.type === "venue") {
    return classified.trust_score >= 0.45 ? "active" : "pending_review";
  }

  if (classified.type === "social" && classified.trust_score >= 0.55) {
    return "active";
  }

  return classified.trust_score > 0.7 ? "active" : "pending_review";
}

export async function classifySearchResult(
  ai: Ai,
  result: { title: string; url: string; description: string },
  cityName: string
): Promise<ClassifiedSource | null> {
  if (isDiscouragedSourceUrl(result.url)) return null;

  if (isLikelyClubSourceUrl(result.url) || isFestivalSourceUrl(result.url)) {
    return {
      url: result.url,
      type: "venue",
      platform: result.title.slice(0, 100),
      trust_score: isFestivalSourceUrl(result.url) ? 0.9 : 0.85,
      has_event_calendar: true,
      rock_metal_focused: true,
    };
  }

  let response: unknown;
  try {
    response = await ai.run(WORKERS_AI_MODEL, {
      messages: [
        {
          role: "system",
          content: buildClassifySourcePrompt(cityName),
        },
        {
          role: "user",
          content: JSON.stringify(result),
        },
      ],
    });
  } catch (error) {
    console.warn("[classify] AI failed, pomijam wynik:", error);
    return null;
  }

  const text =
    typeof response === "object" && response !== null && "response" in response
      ? String((response as { response: string }).response)
      : String(response);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ClassifiedSource;

    if (!parsed.has_event_calendar || parsed.trust_score < 0.35) return null;

    // Kluby mogą mieć mieszany program — nie odrzucaj venue tylko za rock_metal_focused=false
    if (
      parsed.rock_metal_focused === false &&
      parsed.type !== "venue" &&
      parsed.type !== "social"
    ) {
      return null;
    }

    const combined = `${result.title} ${result.description}`;
    if (!matchesGenrePolicy(combined, [], result.url, { sourceType: parsed.type })) {
      return null;
    }

    return { ...parsed, url: result.url };
  } catch {
    return null;
  }
}
