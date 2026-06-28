import type { ParsedEvent } from "./parse-events";
import { parsePolishDateText } from "./extract-venue-events";
import { isJunkTitle } from "../lib/event-quality";
import { isFestivalSourceUrl } from "../lib/festival-scene";

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
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

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

  const title = festivalName.trim();
  if (isJunkTitle(title)) return null;

  return {
    title,
    artists: [],
    starts_at: startsAt,
    venue_name: title,
    ticket_url: baseUrl,
  };
}
