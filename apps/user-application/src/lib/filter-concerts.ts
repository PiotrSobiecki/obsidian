import type { ConcertEvent } from "./api";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Filtruje koncerty w obrębie miasta po tytule, artystach i sali. */
export function filterConcertsByQuery(
  events: ConcertEvent[],
  query: string
): ConcertEvent[] {
  const q = normalize(query.trim());
  if (!q) return events;

  return events.filter((event) => {
    const haystack = normalize(
      [event.title, event.venueName, event.venueAddress, ...(event.artists ?? [])]
        .filter(Boolean)
        .join(" ")
    );
    return haystack.includes(q);
  });
}
