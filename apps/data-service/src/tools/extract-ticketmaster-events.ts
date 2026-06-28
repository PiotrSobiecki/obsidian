import type { ParsedEvent } from "./parse-events";
import { findLocalityInText } from "../lib/nearest-city";

/**
 * Deterministyczny ekstraktor listingu Ticketmaster (`/muzyka/hard-rock-metal`).
 *
 * Listing jest ogólnopolski i ma bardzo regularną strukturę w SSR — po
 * `stripHtml` każdy event to:
 *   `Otwórz dodatkowe informacje dotyczące {TYTUŁ}, {MIASTO} {SALA} {DD.MM.RRRR}, {HH:MM}`
 *
 * Model 8B gubił na tym połowę koncertów (System Of A Down, Judas Priest…) i mylił
 * miasta (Voivod z Gdańska lądował w Warszawie). Parser regexowy bierze wszystko
 * i przypisuje miasto poprawnie — `city` rozpoznajemy po OSTATNIM wystąpieniu znanej
 * nazwy miasta w środku dopasowania (tytuł/support bywają przed miastem i mają
 * przecinki, więc prefiks nie wystarcza).
 */

const TM_EVENT_RE =
  /Otwórz dodatkowe informacje dotyczące (.+?) (\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/g;

function normalizeToken(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** ISO ze strefą PL (przybliżenie DST: kwiecień–październik = +02:00, reszta +01:00). */
function toIso(
  dd: string,
  mm: string,
  yyyy: string,
  HH: string,
  MM: string
): string {
  const month = Number(mm);
  const offset = month >= 4 && month <= 10 ? "+02:00" : "+01:00";
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:00${offset}`;
}

export function extractTicketmasterEvents(
  text: string,
  cityNames: string[]
): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(TM_EVENT_RE)) {
    const middle = m[1].replace(/&amp;/g, "&").trim();
    const [, , dd, mm, yyyy, HH, MM] = m;

    // Miasto = ostatnie wystąpienie znanej nazwy miasta (przed nazwą sali).
    let cityIdx = -1;
    let city = "";
    let matchedCityLen = 0;
    const haystack = normalizeToken(middle);
    for (const cn of cityNames) {
      const idx = haystack.lastIndexOf(normalizeToken(cn));
      if (idx > cityIdx) {
        cityIdx = idx;
        city = cn;
        matchedCityLen = cn.length;
      }
    }

    // Miejscowość spoza filtrów (festiwal, mniejsze miasto) → collector przypisze do najbliższego miasta.
    if (cityIdx < 0) {
      const loc = findLocalityInText(middle);
      if (!loc) continue;
      cityIdx = loc.index;
      city = loc.name;
      matchedCityLen = loc.matchedLength;
    }

    const title = middle
      .slice(0, cityIdx)
      .replace(/[,|]\s*$/, "")
      .trim();
    const venue = middle.slice(cityIdx + matchedCityLen).trim();

    if (!title || /pakiet/i.test(title)) continue; // pomiń pakiety VIP (duplikaty)

    const startsAtIso = toIso(dd, mm, yyyy, HH, MM);
    if (Number.isNaN(Date.parse(startsAtIso))) continue;

    const key = `${normalizeToken(title)}|${yyyy}${mm}${dd}|${normalizeToken(venue)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      title,
      artists: [],
      starts_at: startsAtIso,
      venue_name: venue,
      city,
    });
  }

  return events;
}
