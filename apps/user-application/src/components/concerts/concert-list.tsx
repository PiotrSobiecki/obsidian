import { ConcertCard } from "./concert-card";
import type { ConcertEvent } from "@/lib/api";

type ConcertListProps = {
  events: ConcertEvent[];
};

export function ConcertList({ events }: ConcertListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="font-display text-xl text-muted-foreground">
          Brak koncertów w wybranym okresie
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pokazujemy koncerty klubowe i festiwale rock/metal zebrane z oficjalnych
          źródeł. Spróbuj szerszego zakresu dat lub innego miasta.
        </p>
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  return (
    <ul className="grid w-full list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
      {sorted.map((event) => (
        <li key={event.id} className="min-w-0">
          <ConcertCard event={event} showDate />
        </li>
      ))}
    </ul>
  );
}
