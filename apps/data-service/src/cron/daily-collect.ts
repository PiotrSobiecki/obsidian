import { and, eq, gte, ilike, inArray, isNull, like, lt, lte, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { cities, events, ingestionRuns, sources, venues } from "../db/schema";
import { computeFingerprint } from "../lib/fingerprint";
import {
  assignEventCityId,
  isDiscouragedSourceUrl,
  isJunkEvent,
  normalizeVenueName,
  preferEventTitle,
  resolveEventCityId,
  titlesLikelySameEvent,
  trustsSourceCityId,
  venuesLikelySame,
  type CityGeoRow,
} from "../lib/event-quality";
import { isNationalListingUrl } from "../lib/genre-policy";
import { sanitizeTicketUrl } from "../lib/ticket-url";
import { lookupVenueCityId } from "../lib/venue-city";
import { fetchPage, stripHtml } from "../tools/fetch-page";
import { normalizeCityToken, parseEventsFromHtml } from "../tools/parse-events";
import type { CollectSourceMessage, WorkerBindings } from "../types";

/** Kluby i festiwale mają pierwszeństwo — agregatory rock/metal jako uzupełnienie. */
export const COLLECTOR_MAX_SOURCES = 25;
const FETCH_INTERVAL_HOURS = 20;
/** Wydarzenia, które minęły dawniej niż tyle dni, są usuwane z bazy. */
const DELETE_PAST_AFTER_DAYS = 7;

export type CollectionOptions = {
  /** Pomiń filtr lastFetchedAt (przydatne w dev). */
  force?: boolean;
  maxSources?: number;
  /** Filtr enqueue: tylko źródła z URL zawierającym ten fragment (np. "ticketmaster"). */
  urlLike?: string;
};

/** Znormalizowany rekord źródła — wspólny dla przebiegu inline i kolejki. */
export type CollectableSource = {
  id: string;
  url: string;
  type: string;
  platform: string | null;
  cityId: string;
  cityName: string;
};

/** WHERE wybierające źródła do pobrania (aktywne + venue w pending_review). */
function eligibleSourcesWhere(force?: boolean) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - FETCH_INTERVAL_HOURS);

  return and(
    or(
      eq(sources.status, "active"),
      and(
        eq(sources.status, "pending_review"),
        eq(sources.type, "venue"),
        gte(sources.trustScore, 0.45)
      )
    ),
    force
      ? undefined
      : or(isNull(sources.lastFetchedAt), lt(sources.lastFetchedAt, cutoff))
  );
}

const SOURCE_PRIORITY_ORDER = [
  sql`CASE WHEN ${sources.url} LIKE '%/muzyka/rock' OR ${sources.url} LIKE '%/muzyka/metal' THEN 0 WHEN ${sources.type} = 'venue' THEN 1 WHEN ${sources.type} = 'social' THEN 2 WHEN ${sources.type} = 'aggregator' THEN 3 ELSE 4 END`,
  sql`CASE WHEN ${sources.status} = 'active' THEN 0 ELSE 1 END`,
  sql`${sources.lastFetchedAt} ASC NULLS FIRST`,
] as const;

/**
 * Pobiera i parsuje JEDNO źródło, robi upsert wydarzeń i ustawia lastFetchedAt
 * (tylko po sukcesie — błąd rzucamy do wołającego, by kolejka mogła ponowić).
 * Zwraca liczbę NOWO wstawionych wydarzeń.
 */
export async function collectSource(
  env: WorkerBindings,
  source: CollectableSource,
  now: Date = new Date()
): Promise<number> {
  const db = getDb(env);

  if (isDiscouragedSourceUrl(source.url)) {
    await db.delete(events).where(eq(events.sourceId, source.id));
    await db
      .update(sources)
      .set({ status: "inactive", lastFetchedAt: new Date() })
      .where(eq(sources.id, source.id));
    console.log(`[collector] Dezaktywowano źródło (blocklist): ${source.url}`);
    return 0;
  }

  let eventsUpserted = 0;

  const html = await fetchPage(source.url, env.BROWSER);
  // Ogólnopolskie/agregatorowe listingi mają DZIESIĄTKI koncertów rozsianych po
  // całej (dużej) stronie — np. Ticketmaster ~600 KB. Mały limit ucinał większość
  // (System Of A Down, Judas Priest itd. siedzą głęboko na liście). Bierzemy dużo
  // więcej tekstu; parseEventsFromHtml dzieli go na kawałki.
  const isNational = isNationalListingUrl(source.url);
  const stripLimit = isNational
    ? 120000
    : source.type === "venue"
      ? 18000
      : 48000;
  const snippet = stripHtml(html, stripLimit);

  // Mapa miast — zawsze (przypisanie miasta z treści / najbliższe miasto z bazy).
  let cityIdByToken = new Map<string, string>();
  const cityRows = await db
    .select({
      id: cities.id,
      name: cities.name,
      slug: cities.slug,
      lat: cities.lat,
      lng: cities.lng,
    })
    .from(cities);
  const allCities: CityGeoRow[] = cityRows;
  for (const row of cityRows) {
    cityIdByToken.set(normalizeCityToken(row.name), row.id);
    cityIdByToken.set(normalizeCityToken(row.slug), row.id);
  }
  const cityNames = cityRows.map((r) => r.name);

  const parsed = await parseEventsFromHtml(
    env.AI,
    snippet,
    {
      cityName: source.cityName,
      sourceType: source.type,
      sourceUrl: source.url,
      venueName: source.platform ?? undefined,
      cityNames,
    },
    html
  );

  console.log(`[collector] ${source.url}: ${parsed.length} events parsed`);

  for (const item of parsed) {
    if (isJunkEvent({ title: item.title, ticketUrl: item.ticket_url })) continue;

    const startsAt = new Date(item.starts_at);
    if (startsAt < now) continue;

    const trustsSource = trustsSourceCityId(source.url, source.type);
    const eventCityId = assignEventCityId(
      {
        title: item.title,
        venue_name: item.venue_name,
        city: item.city,
        geo_lat: item.geo_lat,
        geo_lng: item.geo_lng,
      },
      allCities,
      cityIdByToken,
      source.cityId,
      { isNational, trustsSource }
    );
    if (!eventCityId) continue;

    const venueLabel = item.venue_name ? normalizeVenueName(item.venue_name) : null;
    let venueId: string | null = null;

    if (venueLabel) {
      const [existingVenue] = await db
        .select()
        .from(venues)
        .where(and(eq(venues.cityId, eventCityId), eq(venues.name, venueLabel)))
        .limit(1);

      if (existingVenue) {
        venueId = existingVenue.id;
      } else {
        const [newVenue] = await db
          .insert(venues)
          .values({ cityId: eventCityId, name: venueLabel })
          .returning();
        venueId = newVenue.id;
      }
    }

    const fingerprint = await computeFingerprint(item.title, venueId, startsAt);

    let [existing] = await db
      .select({ id: events.id, title: events.title, ticketUrl: events.ticketUrl })
      .from(events)
      .where(eq(events.fingerprint, fingerprint))
      .limit(1);

    if (!existing) {
      const windowStart = new Date(startsAt.getTime() - 3 * 60 * 60 * 1000);
      const windowEnd = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
      const candidates = await db
        .select({
          id: events.id,
          title: events.title,
          ticketUrl: events.ticketUrl,
          venueName: venues.name,
        })
        .from(events)
        .leftJoin(venues, eq(events.venueId, venues.id))
        .where(
          and(
            eq(events.cityId, eventCityId),
            eq(events.status, "active"),
            gte(events.startsAt, windowStart),
            lte(events.startsAt, windowEnd)
          )
        );

      const duplicate = candidates.find(
        (c) =>
          titlesLikelySameEvent(c.title, item.title) &&
          venuesLikelySame(c.venueName, venueLabel)
      );
      if (duplicate) {
        existing = duplicate;
      }
    }

    const ticketUrl = sanitizeTicketUrl(item.ticket_url, source.url);
    const mergedTitle = existing
      ? preferEventTitle(existing.title, item.title)
      : item.title;

    if (existing) {
      await db
        .update(events)
        .set({
          title: mergedTitle,
          artistsJson: item.artists ?? [],
          ticketUrl: ticketUrl ?? existing.ticketUrl ?? undefined,
          priceMin: item.price_min,
          priceMax: item.price_max,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(events.id, existing.id));
    } else {
      await db.insert(events).values({
        cityId: eventCityId,
        venueId,
        sourceId: source.id,
        title: mergedTitle,
        artistsJson: item.artists ?? [],
        startsAt,
        ticketUrl,
        priceMin: item.price_min,
        priceMax: item.price_max,
        status: "active",
        fingerprint,
      });
      eventsUpserted++;
    }
  }

  await db
    .update(sources)
    .set({
      lastFetchedAt: new Date(),
      ...(source.type === "venue" && { status: "active" }),
    })
    .where(eq(sources.id, source.id));

  return eventsUpserted;
}

/**
 * Sprzątanie po zbiórce: przeszłe → past, twarde kasowanie starych, log przebiegu.
 * Niezależne od samej zbiórki (czas-zależne), więc może lecieć osobno (np. w cronie
 * producenta kolejki). Zwraca statystyki sprzątania.
 */
export async function runCollectionCleanup(
  env: WorkerBindings,
  extraStats: Record<string, unknown> = {}
) {
  const db = getDb(env);
  const startedAt = new Date();

  const staleCutoff = new Date();
  const stale = await db
    .update(events)
    .set({ status: "past", updatedAt: new Date() })
    .where(and(eq(events.status, "active"), lt(events.startsAt, staleCutoff)))
    .returning({ id: events.id });

  const deleteCutoff = new Date();
  deleteCutoff.setDate(deleteCutoff.getDate() - DELETE_PAST_AFTER_DAYS);
  const deleted = await db
    .delete(events)
    .where(lt(events.startsAt, deleteCutoff))
    .returning({ id: events.id });

  // Samonaprawcze czyszczenie śmieci: tytuły będące etykietami przycisków, które
  // 8B czasem zapisał jako wydarzenia (już nie powstają — patrz isJunkTitle).
  const junk = await db
    .delete(events)
    .where(
      or(
        ilike(events.title, "Kup bilety%"),
        ilike(events.title, "Kup bilet%"),
        ilike(events.title, "Otwórz dodatkowe%"),
        ilike(events.title, "%.html"),
        ilike(events.title, "koncerty.html"),
        ilike(events.title, "%Terminy koncert%"),
        ilike(events.title, "%rockmetal.pl%"),
        ilike(events.title, "%| Koncerty w Polsce%"),
        ilike(events.title, "% koncerty 2026 |%"),
        ilike(events.title, "% - koncerty - %"),
        ilike(events.ticketUrl, "%rockmetal.pl%"),
        ilike(events.ticketUrl, "%stage24.pl%")
      )
    )
    .returning({ id: events.id });

  const activeForJunkCheck = await db
    .select({ id: events.id, title: events.title, ticketUrl: events.ticketUrl })
    .from(events)
    .where(eq(events.status, "active"));

  const junkTitleIds = activeForJunkCheck
    .filter((row) => isJunkEvent(row))
    .map((row) => row.id);

  const junkByTitle =
    junkTitleIds.length > 0
      ? await db
          .delete(events)
          .where(inArray(events.id, junkTitleIds))
          .returning({ id: events.id })
      : [];

  const allSources = await db.select({ id: sources.id, url: sources.url }).from(sources);
  const discouragedSourceIds = allSources
    .filter((s) => isDiscouragedSourceUrl(s.url))
    .map((s) => s.id);

  let discouragedSourcesDeactivated = 0;
  let eventsFromDiscouragedSources = 0;
  if (discouragedSourceIds.length > 0) {
    discouragedSourcesDeactivated = (
      await db
        .update(sources)
        .set({ status: "inactive" })
        .where(inArray(sources.id, discouragedSourceIds))
        .returning({ id: sources.id })
    ).length;

    eventsFromDiscouragedSources = (
      await db
        .delete(events)
        .where(inArray(events.sourceId, discouragedSourceIds))
        .returning({ id: events.id })
    ).length;
  }

  const cityRows = await db
    .select({
      id: cities.id,
      name: cities.name,
      slug: cities.slug,
      lat: cities.lat,
      lng: cities.lng,
    })
    .from(cities);

  const now = new Date();
  const activeFuture = await db
    .select({
      id: events.id,
      cityId: events.cityId,
      title: events.title,
      startsAt: events.startsAt,
      ticketUrl: events.ticketUrl,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(eq(events.status, "active"), gte(events.startsAt, now)));

  let cityReassigned = 0;
  for (const row of activeFuture) {
    const fromVenue = lookupVenueCityId(row.venueName ?? undefined, cityRows);
    const detected =
      fromVenue ??
      resolveEventCityId(`${row.title} ${row.venueName ?? ""}`, cityRows);
    if (detected && detected !== row.cityId) {
      await db
        .update(events)
        .set({ cityId: detected, updatedAt: new Date() })
        .where(eq(events.id, row.id));
      cityReassigned++;
    }
  }

  const refreshed =
    cityReassigned > 0
      ? await db
          .select({
            id: events.id,
            cityId: events.cityId,
            title: events.title,
            startsAt: events.startsAt,
            ticketUrl: events.ticketUrl,
            venueName: venues.name,
          })
          .from(events)
          .leftJoin(venues, eq(events.venueId, venues.id))
          .where(and(eq(events.status, "active"), gte(events.startsAt, now)))
      : activeFuture;

  const duplicateIds = new Set<string>();
  const byCity = new Map<string, typeof refreshed>();
  for (const row of refreshed) {
    const list = byCity.get(row.cityId) ?? [];
    list.push(row);
    byCity.set(row.cityId, list);
  }

  for (const group of byCity.values()) {
    for (let i = 0; i < group.length; i++) {
      const a = group[i];
      if (duplicateIds.has(a.id)) continue;
      for (let j = i + 1; j < group.length; j++) {
        const b = group[j];
        if (duplicateIds.has(b.id)) continue;
        const diffMs = Math.abs(a.startsAt.getTime() - b.startsAt.getTime());
        if (diffMs > 3 * 60 * 60 * 1000) continue;
        if (
          !titlesLikelySameEvent(a.title, b.title) ||
          !venuesLikelySame(a.venueName, b.venueName)
        ) {
          continue;
        }
        const dropId =
          a.ticketUrl && !b.ticketUrl
            ? b.id
            : b.ticketUrl && !a.ticketUrl
              ? a.id
              : preferEventTitle(a.title, b.title) === a.title
                ? b.id
                : a.id;
        duplicateIds.add(dropId);
        if (dropId === a.id) break;
      }
    }
  }

  const duplicatesRemoved =
    duplicateIds.size > 0
      ? await db
          .delete(events)
          .where(inArray(events.id, [...duplicateIds]))
          .returning({ id: events.id })
      : [];

  await db.insert(ingestionRuns).values({
    agentType: "collector",
    startedAt,
    finishedAt: new Date(),
    statsJson: {
      eventsMarkedPast: stale.length,
      eventsDeleted: deleted.length,
      junkDeleted: junk.length + junkByTitle.length,
      discouragedSourcesDeactivated,
      eventsFromDiscouragedSources,
      cityReassigned,
      duplicatesRemoved: duplicatesRemoved.length,
      ...extraStats,
    },
  });

  return {
    eventsMarkedPast: stale.length,
    eventsDeleted: deleted.length,
    junkDeleted: junk.length + junkByTitle.length,
    discouragedSourcesDeactivated,
    eventsFromDiscouragedSources,
    cityReassigned,
    duplicatesRemoved: duplicatesRemoved.length,
  };
}

/**
 * Producer kolejki collect: wrzuca po jednym komunikacie na każde uprawnione
 * źródło. Bez limitu 25 — kolejka rozkłada obciążenie na wiele wywołań Workera.
 */
export async function enqueueCollection(
  env: WorkerBindings,
  options: CollectionOptions = {}
): Promise<number> {
  const db = getDb(env);

  const rows = await db
    .select({
      id: sources.id,
      url: sources.url,
      type: sources.type,
      platform: sources.platform,
      cityId: sources.cityId,
      cityName: cities.name,
    })
    .from(sources)
    .innerJoin(cities, eq(sources.cityId, cities.id))
    .where(
      and(
        eligibleSourcesWhere(options.force),
        options.urlLike ? like(sources.url, `%${options.urlLike}%`) : undefined
      )
    )
    .orderBy(...SOURCE_PRIORITY_ORDER);

  const messages: { body: CollectSourceMessage }[] = rows.map((r) => ({
    body: {
      sourceId: r.id,
      url: r.url,
      type: r.type,
      platform: r.platform,
      cityId: r.cityId,
      cityName: r.cityName,
    },
  }));

  // sendBatch: maks. 100 komunikatów na żądanie.
  for (let i = 0; i < messages.length; i += 100) {
    await env.COLLECT_QUEUE.sendBatch(messages.slice(i, i + 100));
  }

  console.log(`[collector] Wrzucono do kolejki ${messages.length} źródeł`);
  return messages.length;
}

/**
 * Inline zbiórka (capped) — używana przez /admin/collect do szybkich testów
 * i jako fallback. Cron/produkcja używają kolejki (enqueueCollection).
 */
export async function executeCollection(
  env: WorkerBindings,
  options: CollectionOptions = {}
) {
  const db = getDb(env);
  let sourcesFetched = 0;
  let eventsUpserted = 0;
  let clubSourcesFetched = 0;
  let sourcesFailed = 0;

  const maxSources =
    options.maxSources ??
    (env.ENVIRONMENT === "development" ? 5 : COLLECTOR_MAX_SOURCES);

  const activeSources = await db
    .select({
      id: sources.id,
      url: sources.url,
      type: sources.type,
      platform: sources.platform,
      cityId: sources.cityId,
      cityName: cities.name,
    })
    .from(sources)
    .innerJoin(cities, eq(sources.cityId, cities.id))
    .where(eligibleSourcesWhere(options.force))
    .orderBy(...SOURCE_PRIORITY_ORDER)
    .limit(maxSources);

  console.log(
    `[collector] Start: ${activeSources.length} sources (max=${maxSources}, force=${!!options.force})`
  );

  const now = new Date();

  for (const source of activeSources) {
    try {
      await new Promise((r) => setTimeout(r, 1000));
      console.log(`[collector] Fetching ${source.url}`);
      eventsUpserted += await collectSource(env, source, now);
      sourcesFetched++;
      if (source.type === "venue" || source.type === "social") {
        clubSourcesFetched++;
      }
    } catch (error) {
      sourcesFailed++;
      console.error(`[collector] Failed ${source.url}:`, error);
      await db
        .update(sources)
        .set({ lastFetchedAt: new Date() })
        .where(eq(sources.id, source.id));
    }
  }

  const cleanup = await runCollectionCleanup(env, {
    sourcesFetched,
    sourcesFailed,
    clubSourcesFetched,
    eventsUpserted,
    maxSourcesPerRun: maxSources,
    force: !!options.force,
  });

  const result = {
    sourcesFetched,
    sourcesFailed,
    clubSourcesFetched,
    eventsUpserted,
    ...cleanup,
    maxSources,
  };

  console.log("[collector] Done:", result);
  return result;
}
