import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isValidTicketUrl, ticketProviderLabel, formatTicketHost } from "@/lib/ticket-url";
import type { ConcertEvent } from "@/lib/api";
import { formatEventDate, formatEventTime } from "@/lib/api";

type ConcertCardProps = {
  event: ConcertEvent;
  showDate?: boolean;
  showCity?: boolean;
};

export function ConcertCard({ event, showDate, showCity }: ConcertCardProps) {
  const artists = event.artists?.length ? event.artists.join(", ") : null;
  const isToday =
    event.startsAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  const price =
    event.priceMin != null
      ? event.priceMax != null && event.priceMax !== event.priceMin
        ? `${event.priceMin}–${event.priceMax} zł`
        : `od ${event.priceMin} zł`
      : null;

  const ticketUrl = event.ticketUrl;
  const ticketLabel =
    event.ticketProvider ??
    (ticketUrl ? ticketProviderLabel(ticketUrl) : null);

  return (
    <Card className="h-full border-l-4 border-l-primary bg-card transition-shadow hover:shadow-[0_0_20px_rgba(220,38,38,0.25)]">
      <CardContent className="p-5">
        {showDate && (
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" strokeWidth={2} />
            <span className="font-medium text-foreground">
              {formatEventDate(event.startsAt)}
            </span>
            {isToday && (
              <span className="rounded bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-black">
                Dziś
              </span>
            )}
          </div>
        )}
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
          {event.title}
        </h3>
        {artists && (
          <p className="mt-1 text-sm text-muted-foreground">{artists}</p>
        )}

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" strokeWidth={2} />
            <span>{formatEventTime(event.startsAt)}</span>
          </div>
          {event.venueName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <span>
                {event.venueName}
                {showCity && event.cityName ? `, ${event.cityName}` : ""}
                {event.venueAddress ? `, ${event.venueAddress}` : ""}
              </span>
            </div>
          )}
          {!event.venueName && showCity && event.cityName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <span>{event.cityName}</span>
            </div>
          )}
          {price && (
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" strokeWidth={2} />
              <span>{price}</span>
            </div>
          )}
        </div>

        {isValidTicketUrl(ticketUrl) && (
          <div className="mt-4 space-y-1">
            <Button asChild size="sm" className="uppercase tracking-wider">
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={ticketUrl}
              >
                Bilety — {ticketLabel}
              </a>
            </Button>
            <p className="text-xs text-muted-foreground truncate" title={ticketUrl}>
              {formatTicketHost(ticketUrl)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
