export type ConcertEvent = {
  id: string;
  title: string;
  artists: string[];
  startsAt: string;
  endsAt: string | null;
  ticketUrl: string | null;
  ticketProvider?: string | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  venueName: string | null;
  venueAddress: string | null;
  cityName: string;
  citySlug: string;
};

export type EventsResponse = {
  city: { name: string; slug: string };
  from: string;
  to: string;
  events: ConcertEvent[];
};

export type DateRange = "day" | "3days" | "7days" | "3months";

export const ALL_POLAND_SLUG = "cala-polska";

export function isAllPolandCity(slug: string): boolean {
  return slug === ALL_POLAND_SLUG;
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
}

export async function fetchEvents(
  city: string,
  date: string,
  range: DateRange,
  signal?: AbortSignal
): Promise<EventsResponse> {
  const params = new URLSearchParams({ city, from: date, range });
  const response = await fetch(`${getApiUrl()}/events?${params}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function groupEventsByDate(
  events: ConcertEvent[]
): Map<string, ConcertEvent[]> {
  const groups = new Map<string, ConcertEvent[]>();

  for (const event of events) {
    const key = event.startsAt.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }

  return groups;
}
