"use client";

import { Search, X } from "lucide-react";

type ConcertSearchProps = {
  cityName: string;
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
  disabled?: boolean;
};

export function ConcertSearch({
  cityName,
  value,
  onChange,
  resultCount,
  totalCount,
  disabled,
}: ConcertSearchProps) {
  const showCount =
    value.trim().length > 0 &&
    resultCount !== undefined &&
    totalCount !== undefined;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <label htmlFor="concert-query" className="mb-2 block text-sm font-medium text-muted-foreground">
        Szukaj w {cityName}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <input
          id="concert-query"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Artysta, zespół, klub…"
          autoComplete="off"
          disabled={disabled}
          className="w-full rounded-md border border-border bg-secondary py-2.5 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Wyczyść wyszukiwanie"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showCount && (
        <p className="mt-2 text-xs text-muted-foreground">
          {resultCount === 0
            ? "Brak wyników — spróbuj innej frazy"
            : `${resultCount} z ${totalCount} koncertów`}
        </p>
      )}
    </div>
  );
}
