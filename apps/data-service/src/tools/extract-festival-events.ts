import type { ParsedEvent } from "./parse-events";
import { parsePolishDateText } from "./extract-venue-events";
import { isJunkTitle } from "../lib/event-quality";
import type { GenreMatchContext } from "../lib/genre-policy";
import { matchesGenrePolicy } from "../lib/genre-policy";
import { isFestivalSourceUrl } from "../lib/festival-scene";

const MONTHS_PL: Record<string, number> = {
  stycznia: 1,
  lutego: 2,
  marca: 3,
  kwietnia: 4,
  maja: 5,
  czerwca: 6,
  lipca: 7,
  sierpnia: 8,
  wrzesnia: 9,
  września: 9,
  pazdziernika: 10,
  października: 10,
  listopada: 11,
  grudnia: 12,
};

function normalizeMonthToken(token: string): string {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function toIsoDateTime(
  year: number,
  month: number,
  day: number,
  hour = 18,
  minute = 0
): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseSlashDateTime(
  day: string,
  month: string,
  year: string,
  hour: string,
  minute: string
): string | null {
  return toIsoDateTime(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute)
  );
}

/** Pierwsza przyszła data z JSON-LD (startDate / startTime) na stronie festiwalu. */
function findJsonLdStartDate(html: string): string | null {
  for (const match of html.matchAll(/"startDate"\s*:\s*"([^"]+)"/gi)) {
    const raw = match[1];
    if (!raw || Number.isNaN(Date.parse(raw))) continue;
    if (new Date(raw) >= new Date()) return new Date(raw).toISOString();
  }
  return null;
}

/** Szuka daty otwarcia festiwalu w widocznym tekście strony. */
function findFestivalDateInText(html: string): string | null {
  // JSON-LD / meta (caption: „Inne Brzmienia 2-5 lipca 2026 Lublin”)
  const caption = html.match(
    /"caption":"[^"]*?(\d{1,2})-(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/i
  );
  if (caption) {
    const month = MONTHS_PL[normalizeMonthToken(caption[3])];
    if (month) {
      const iso = toIsoDateTime(Number(caption[4]), month, Number(caption[1]));
      if (iso && new Date(iso) >= new Date()) return iso;
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  // np. „2-5 LIPCA 2026” (Inne Brzmienia)
  const rangeMonth = text.match(
    /(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+(\d{4})/i
  );
  if (rangeMonth) {
    const month = MONTHS_PL[normalizeMonthToken(rangeMonth[3])];
    if (month) {
      const iso = toIsoDateTime(Number(rangeMonth[4]), month, Number(rangeMonth[1]));
      if (iso && new Date(iso) >= new Date()) return iso;
    }
  }

  const range = text.match(
    /(\d{1,2})\s*(?:-|–|—|do)\s*(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/i
  );
  if (range) {
    const iso = parsePolishDateText(`${range[1]} ${range[3]} ${range[4]}`);
    if (iso && new Date(iso) >= new Date()) return iso;
  }

  const single = text.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/i);
  if (single) {
    const iso = parsePolishDateText(`${single[1]} ${single[2]} ${single[3]}`);
    if (iso && new Date(iso) >= new Date()) return iso;
  }

  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—");
}

function cleanArtistTitle(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/^#+\s*/, "")
    .replace(/\s*\|.*$/, "")
    .replace(/[^\p{L}\p{N}\s'’.?&!+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushLineupEvent(
  events: ParsedEvent[],
  seen: Set<string>,
  now: Date,
  title: string,
  startsAt: string | null,
  festivalName: string,
  baseUrl: string,
  genreCtx?: GenreMatchContext
): void {
  if (!startsAt || new Date(startsAt) < now) return;
  if (title.length < 3 || isJunkTitle(title)) return;
  if (
    genreCtx &&
    !matchesGenrePolicy(title, [], baseUrl, {
      ...genreCtx,
      venueName: festivalName,
    })
  ) {
    return;
  }
  const key = `${title}|${startsAt}`.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  events.push({
    title,
    artists: [title],
    starts_at: startsAt,
    venue_name: festivalName,
    ticket_url: baseUrl,
  });
}

/**
 * Lineup z datą DD/MM/YYYY | HH:MM — np. innebrzmienia.eu (Furia, Therapy? itd.).
 * Każdy koncert przechodzi matchesGenrePolicy (tylko rock/metal/pokrewne).
 */
export function extractFestivalLineupEvents(
  html: string,
  festivalName: string,
  baseUrl: string,
  genreCtx?: GenreMatchContext
): ParsedEvent[] {
  if (!isFestivalSourceUrl(baseUrl)) return [];

  const events: ParsedEvent[] = [];
  const seen = new Set<string>();
  const now = new Date();

  // WordPress Avada: <h4>Artysta</h4> … DD/MM/YYYY | HH:MM
  const h4BlockRe =
    /<h4[^>]*>([^<]{3,120})<\/h4>[\s\S]{0,1200}?(\d{2})\/(\d{2})\/(\d{4})\s*\|\s*(\d{2}):(\d{2})/gi;
  for (const match of html.matchAll(h4BlockRe)) {
    const title = cleanArtistTitle(match[1]);
    const startsAt = parseSlashDateTime(
      match[2],
      match[3],
      match[4],
      match[5],
      match[6]
    );
    pushLineupEvent(events, seen, now, title, startsAt, festivalName, baseUrl, genreCtx);
  }

  // Ten sam wzorzec w oczyszczonym tekście (bez wymogu początku linii)
  const plain = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const inlineRe =
    /([A-Za-zÀ-ž][A-Za-zÀ-ž0-9'’.?&\s-]{2,90}?)\s+(\d{2})\/(\d{2})\/(\d{4})\s*\|\s*(\d{2}):(\d{2})/g;
  for (const match of plain.matchAll(inlineRe)) {
    const title = cleanArtistTitle(match[1]);
    const startsAt = parseSlashDateTime(
      match[2],
      match[3],
      match[4],
      match[5],
      match[6]
    );
    pushLineupEvent(events, seen, now, title, startsAt, festivalName, baseUrl, genreCtx);
  }

  return events;
}

/**
 * Harmonogram dzienny: „PIĄTEK 26.06.2026: Vader, Furia, …” (hellsbells.pl/artysci).
 */
export function extractFestivalDayScheduleEvents(
  html: string,
  festivalName: string,
  baseUrl: string,
  genreCtx?: GenreMatchContext
): ParsedEvent[] {
  if (!isFestivalSourceUrl(baseUrl)) return [];

  const events: ParsedEvent[] = [];
  const seen = new Set<string>();
  const now = new Date();

  const dayRe =
    /(?:PIĄTEK|SOBOTA|PONIEDZIAŁEK|WTOREK|ŚRODA|CZWARTEK|NIEDZIELA)\s+(\d{2})\.(\d{2})\.(\d{4})\s*:\s*([^<]+)/gi;

  for (const match of html.matchAll(dayRe)) {
    const startsAt = toIsoDateTime(
      Number(match[3]),
      Number(match[2]),
      Number(match[1]),
      18,
      0
    );
    if (!startsAt || new Date(startsAt) < now) continue;

    const artists = match[4]
      .split(",")
      .map((a) => cleanArtistTitle(a.replace(/\([^)]*\)/g, "").trim()))
      .filter((a) => a.length >= 2);

    for (const artist of artists) {
      pushLineupEvent(events, seen, now, artist, startsAt, festivalName, baseUrl, genreCtx);
    }
  }

  return events;
}

/**
 * Gdy parsery klubowe/LLM nic nie zwrócą — jeden wpis festiwalu ze strony głównej
 * (Castle Party, Mystic Festival itd. często mają datę w HTML, ale nie w linkach).
 */
export function extractFestivalHomepageEvent(
  html: string,
  festivalName: string,
  baseUrl: string
): ParsedEvent | null {
  if (!isFestivalSourceUrl(baseUrl) || !festivalName.trim()) return null;

  const startsAt = findJsonLdStartDate(html) ?? findFestivalDateInText(html);
  if (!startsAt) return null;

  let title = festivalName.trim();
  const pageTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
  if (
    pageTitle &&
    /inne\s*brzmienia|off\s*festival|wschód\s*kultury|wschod\s*kultury/i.test(pageTitle)
  ) {
    title = pageTitle;
  }
  if (isJunkTitle(title)) return null;

  return {
    title,
    artists: [],
    starts_at: startsAt,
    venue_name: title,
    ticket_url: baseUrl,
  };
}
