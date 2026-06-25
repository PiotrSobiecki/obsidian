"use client";

import { POLISH_CITIES } from "@/data/cities-pl";
import type { DateRange } from "@/lib/api";
import { Calendar } from "lucide-react";

type ConcertFiltersProps = {
  city: string;
  date: string;
  range: DateRange;
  onCityChange: (city: string) => void;
  onDateChange: (date: string) => void;
  onRangeChange: (range: DateRange) => void;
  onSearch: () => void;
  loading?: boolean;
};

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "day", label: "Dziś" },
  { value: "3days", label: "3 dni" },
  { value: "7days", label: "7 dni" },
  { value: "3months", label: "3 mies." },
];

export function ConcertFilters({
  city,
  date,
  range,
  onCityChange,
  onDateChange,
  onRangeChange,
  onSearch,
  loading,
}: ConcertFiltersProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,2fr)_auto]">
        <div className="sm:col-span-1">
          <label htmlFor="city" className="mb-2 block text-sm font-medium text-muted-foreground">
            Miasto
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Wybierz miasto</option>
            {POLISH_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="date" className="mb-2 block text-sm font-medium text-muted-foreground">
            Data
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary py-2.5 pl-10 pr-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <span className="mb-2 block text-sm font-medium text-muted-foreground">Zakres</span>
          <div className="grid grid-cols-4 gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRangeChange(opt.value)}
                className={`rounded-md px-2 py-2.5 text-sm transition-colors ${
                  range === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <button
            type="button"
            onClick={onSearch}
            disabled={!city || loading}
            className="w-full rounded-md bg-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-[7.5rem]"
          >
            {loading ? "Szukam..." : "Szukaj"}
          </button>
        </div>
      </div>
    </div>
  );
}
