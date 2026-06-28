import type { ParsedEvent } from "./parse-events";
import { isGenericNavigationPath, isJunkTitle } from "../lib/event-quality";
import { looksLikeTicketUrl, resolveTicketUrl } from "../lib/ticket-url";

const MONTHS_PL: Record<string, number> = {
  stycznia: 1,
  styczniu: 1,
  lutego: 2,
  lutym: 2,
  marca: 3,
  marcowym: 3,
  kwietnia: 4,
  kwietniu: 4,
  maja: 5,
  maju: 5,
  czerwca: 6,
  czerwcu: 6,
  lipca: 7,
  lipcu: 7,
  sierpnia: 8,
  sierpniu: 8,
  wrzesnia: 9,
  września: 9,
  wrzesniu: 9,
  wrześniu: 9,
  pazdziernika: 10,
  października: 10,
  pazdzierniku: 10,
  październiku: 10,
  listopada: 11,
  listopadzie: 11,
  grudnia: 12,
  grudniu: 12,
};

function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&raquo;/g, "»")
    .replace(/&laquo;/g, "«")
    .trim();
}

function normalizeMonthToken(token: string): string {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day, 18, 0, 0));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseDateFromSlug(slug: string): string | null {
  const normalized = slug.toLowerCase();
  const slugMatch = normalized.match(/(\d{1,2})-([a-z]+)-(\d{4})/);
  if (slugMatch) {
    const day = Number(slugMatch[1]);
    const month = MONTHS_PL[normalizeMonthToken(slugMatch[2])];
    const year = Number(slugMatch[3]);
    if (month) return toIsoDate(year, month, day);
  }

  const dotted = normalized.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{4})/);
  if (dotted) {
    return toIsoDate(Number(dotted[3]), Number(dotted[2]), Number(dotted[1]));
  }

  return null;
}

export function parsePolishDateText(text: string): string | null {
  const dotted = text.match(/(\d{1,2})[.](\d{1,2})[.](\d{4})/);
  if (dotted) {
    return toIsoDate(Number(dotted[3]), Number(dotted[2]), Number(dotted[1]));
  }

  const words = text.toLowerCase();
  const verbal = words.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/);
  if (verbal) {
    const month = MONTHS_PL[normalizeMonthToken(verbal[2])];
    if (month) return toIsoDate(Number(verbal[3]), month, Number(verbal[1]));
  }

  return null;
}

function looksLikeEventLink(href: string, label: string): boolean {
  const hay = `${href} ${label}`.toLowerCase();
  if (/rockmetal\.pl|stage24\.pl|terminy koncert/i.test(hay)) return false;
  if (/fotorelacja|galeria|news|aktualnosci|wpis|category|tag|author|feed|polityka|kontakt/i.test(hay)) {
    return false;
  }
  if (/koncert|metal|rock|punk|hardcore|tour|live|festiwal|festival|support|klub|b90|gig/i.test(hay)) {
    return true;
  }
  return parseDateFromSlug(href) != null;
}

function titleFromSlug(pathname: string): string {
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  return decodeHtml(
    slug
      .replace(/\d{1,2}-[a-z]+-\d{4}/gi, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Heurystyczny parser kalendarzy klubowych (WordPress, B90, itp.) — bez LLM. */
export function extractVenueEventsFromHtml(
  html: string,
  venueName: string,
  baseUrl: string
): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const seen = new Set<string>();
  const now = new Date();

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkRe)) {
    const href = match[1];
    const label = decodeHtml(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (label.length < 4 && !parseDateFromSlug(href)) continue;
    if (!looksLikeEventLink(href, label)) continue;

    const ticketUrl = resolveTicketUrl(href, baseUrl);
    if (!ticketUrl) continue;

    let pathname = "";
    try {
      pathname = new URL(ticketUrl).pathname;
    } catch {
      continue;
    }

    if (isGenericNavigationPath(pathname)) continue;

    const startsAt =
      parseDateFromSlug(pathname) ??
      parseDateFromSlug(ticketUrl) ??
      parsePolishDateText(label) ??
      parsePolishDateText(pathname);

    if (!startsAt || new Date(startsAt) < now) continue;

    const title = label.length >= 4 ? label : titleFromSlug(pathname);
    if (title.length < 3 || isJunkTitle(title)) continue;

    const key = `${title}|${startsAt}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      title,
      artists: [],
      starts_at: startsAt,
      venue_name: venueName,
      ticket_url: looksLikeTicketUrl(ticketUrl) ? ticketUrl : undefined,
    });
  }

  const timeRe = /<time[^>]+datetime=["']([^"']+)["'][^>]*>[\s\S]*?<\/time>/gi;
  for (const match of html.matchAll(timeRe)) {
    const startsAt = match[1];
    if (!startsAt || Number.isNaN(Date.parse(startsAt))) continue;
    if (new Date(startsAt) < now) continue;

    const chunk = html.slice(Math.max(0, (match.index ?? 0) - 400), (match.index ?? 0) + 400);
    const titleMatch = chunk.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{4,120})<\/a>/i);
    if (!titleMatch) continue;

    const title = decodeHtml(titleMatch[2]).trim();
    if (isJunkTitle(title)) continue;
    const ticketUrl = resolveTicketUrl(titleMatch[1], baseUrl) ?? undefined;
    const key = `${title}|${startsAt}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      title,
      artists: [],
      starts_at: new Date(startsAt).toISOString(),
      venue_name: venueName,
      ticket_url: ticketUrl,
    });
  }

  return events;
}
