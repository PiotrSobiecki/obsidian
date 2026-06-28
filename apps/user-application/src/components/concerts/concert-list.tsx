import { ConcertCard } from "./concert-card";
import type { ConcertEvent } from "@/lib/api";

type ConcertListProps = {
  events: ConcertEvent[];
  query?: string;
  showCity?: boolean;
};

export function ConcertList({ events, query, showCity }: ConcertListProps) {
  if (events.length === 0) {
    const trimmed = query?.trim();
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="font-display text-xl text-muted-foreground">
          {trimmed ? `Brak wyników dla „${trimmed}"` : "Brak koncertów w wybranym okresie"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {trimmed
            ? "Sprawdź pisownię lub wyczyść wyszukiwanie, aby zobaczyć wszystkie koncerty."
            : "Pokazujemy koncerty klubowe i festiwale rock/metal zebrane z oficjalnych źródeł. Spróbuj szerszego zakresu dat lub innego miasta."}
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
          <ConcertCard event={event} showDate showCity={showCity} />
        </li>
      ))}
    </ul>
  );
}
