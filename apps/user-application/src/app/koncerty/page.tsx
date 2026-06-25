"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { ConcertFilters } from "@/components/concerts/concert-filters";
import { ConcertList } from "@/components/concerts/concert-list";
import {
  fetchEvents,
  type ConcertEvent,
  type DateRange,
} from "@/lib/api";
import { AlertTriangle } from "lucide-react";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function KoncertyPage() {
  const [city, setCity] = useState("warszawa");
  const [date, setDate] = useState(todayIso());
  const [range, setRange] = useState<DateRange>("7days");
  const [events, setEvents] = useState<ConcertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(
    async (signal?: AbortSignal) => {
      if (!city) return;

      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        const data = await fetchEvents(city, date, range, signal);
        if (!signal?.aborted) {
          setEvents(data.events);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          "Nie udało się pobrać koncertów. Sprawdź połączenie z API lub spróbuj ponownie."
        );
        setEvents([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [city, date, range]
  );

  useEffect(() => {
    if (!city) {
      setSearched(false);
      setEvents([]);
      return;
    }

    const ac = new AbortController();
    void runSearch(ac.signal);
    return () => ac.abort();
  }, [city, date, range, runSearch]);

  const handleCityChange = useCallback((nextCity: string) => {
    setCity(nextCity);
    setEvents([]);
    setError(null);

    if (!nextCity) {
      setSearched(false);
      setLoading(false);
    }
  }, []);

  const handleRangeChange = useCallback((next: DateRange) => {
    setRange(next);
    if (next === "day") {
      setDate(todayIso());
    }
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pb-16 pt-28">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Znajdź <span className="text-primary">koncert</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Wybierz miasto i datę — pokażemy koncerty z bazy (zbierane przez agentów).
          </p>
        </div>

        <div className="mb-8">
          <ConcertFilters
            city={city}
            date={date}
            range={range}
            onCityChange={handleCityChange}
            onDateChange={setDate}
            onRangeChange={handleRangeChange}
            onSearch={() => void runSearch()}
            loading={loading}
          />
        </div>

        {loading && (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            Szukam koncertów…
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {searched && !loading && !error && <ConcertList events={events} />}

        {!searched && !loading && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            Ustaw filtry i kliknij „Szukaj”, aby zobaczyć koncerty.
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
