import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { cities, events, ingestionRuns, sources, venues } from "../db/schema";
import { computeFingerprint } from "../lib/fingerprint";
import { sanitizeTicketUrl } from "../lib/ticket-url";
import { fetchPage, stripHtml } from "../tools/fetch-page";
import { parseEventsFromHtml } from "../tools/parse-events";
import type { WorkerBindings } from "../types";

/** Kluby i festiwale mają pierwszeństwo — agregatory rock/metal jako uzupełnienie. */
export const COLLECTOR_MAX_SOURCES = 25;
const FETCH_INTERVAL_HOURS = 20;
/** Wydarzenia, które minęły dawniej niż tyle dni, są usuwane z bazy. */
const DELETE_PAST_AFTER_DAYS = 7;

export type CollectionOptions = {
  /** Pomiń filtr lastFetchedAt (przydatne w dev). */
  force?: boolean;
  maxSources?: number;
};

export async function executeCollection(
  env: WorkerBindings,
  options: CollectionOptions = {}
) {
  const db = getDb(env);
  const startedAt = new Date();
  let sourcesFetched = 0;
  let eventsUpserted = 0;
  let clubSourcesFetched = 0;
  let sourcesFailed = 0;

  const maxSources =
    options.maxSources ??
    (env.ENVIRONMENT === "development" ? 5 : COLLECTOR_MAX_SOURCES);

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - FETCH_INTERVAL_HOURS);

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
    .where(
      and(
        or(
          eq(sources.status, "active"),
          and(
            eq(sources.status, "pending_review"),
            eq(sources.type, "venue"),
            gte(sources.trustScore, 0.45)
          )
        ),
        options.force
          ? undefined
          : or(isNull(sources.lastFetchedAt), lt(sources.lastFetchedAt, cutoff))
      )
    )
    .orderBy(
      sql`CASE WHEN ${sources.url} LIKE '%/muzyka/rock' OR ${sources.url} LIKE '%/muzyka/metal' THEN 0 WHEN ${sources.type} = 'venue' THEN 1 WHEN ${sources.type} = 'social' THEN 2 WHEN ${sources.type} = 'aggregator' THEN 3 ELSE 4 END`,
      sql`CASE WHEN ${sources.status} = 'active' THEN 0 ELSE 1 END`,
      sql`${sources.lastFetchedAt} ASC NULLS FIRST`
    )
    .limit(maxSources);

  console.log(
    `[collector] Start: ${activeSources.length} sources (max=${maxSources}, force=${!!options.force})`
  );

  const now = new Date();

  for (const source of activeSources) {
    try {
      await new Promise((r) => setTimeout(r, 1000));

      console.log(`[collector] Fetching ${source.url}`);
      const html = await fetchPage(source.url, env.BROWSER);
      const snippet = stripHtml(
        html,
        source.type === "venue" ? 18000 : 12000
      );
      const parsed = await parseEventsFromHtml(
        env.AI,
        snippet,
        {
          cityName: source.cityName,
          sourceType: source.type,
          sourceUrl: source.url,
          venueName: source.platform ?? undefined,
        },
        html
      );

      console.log(`[collector] ${source.url}: ${parsed.length} events parsed`);

      for (const item of parsed) {
        const startsAt = new Date(item.starts_at);
        if (startsAt < now) continue;

        let venueId: string | null = null;

        if (item.venue_name) {
          const [existingVenue] = await db
            .select()
            .from(venues)
            .where(
              and(eq(venues.cityId, source.cityId), eq(venues.name, item.venue_name))
            )
            .limit(1);

          if (existingVenue) {
            venueId = existingVenue.id;
          } else {
            const [newVenue] = await db
              .insert(venues)
              .values({ cityId: source.cityId, name: item.venue_name })
              .returning();
            venueId = newVenue.id;
          }
        }

        const fingerprint = await computeFingerprint(item.title, venueId, startsAt);

        const [existing] = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.fingerprint, fingerprint))
          .limit(1);

        const ticketUrl = sanitizeTicketUrl(item.ticket_url, source.url);

        if (existing) {
          await db
            .update(events)
            .set({
              title: item.title,
              artistsJson: item.artists ?? [],
              ticketUrl: ticketUrl ?? undefined,
              priceMin: item.price_min,
              priceMax: item.price_max,
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(events.id, existing.id));
        } else {
          await db.insert(events).values({
            cityId: source.cityId,
            venueId,
            sourceId: source.id,
            title: item.title,
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

  const staleCutoff = new Date();

  const stale = await db
    .update(events)
    .set({ status: "past", updatedAt: new Date() })
    .where(and(eq(events.status, "active"), lt(events.startsAt, staleCutoff)))
    .returning({ id: events.id });

  // Twarde kasowanie wydarzeń, które minęły ponad DELETE_PAST_AFTER_DAYS temu —
  // i tak nie pokazujemy przeszłych, więc nie trzymamy ich w bazie.
  const deleteCutoff = new Date();
  deleteCutoff.setDate(deleteCutoff.getDate() - DELETE_PAST_AFTER_DAYS);

  const deleted = await db
    .delete(events)
    .where(lt(events.startsAt, deleteCutoff))
    .returning({ id: events.id });

  await db.insert(ingestionRuns).values({
    agentType: "collector",
    startedAt,
    finishedAt: new Date(),
    statsJson: {
      sourcesFetched,
      sourcesFailed,
      clubSourcesFetched,
      eventsUpserted,
      eventsMarkedPast: stale.length,
      eventsDeleted: deleted.length,
      maxSourcesPerRun: maxSources,
      force: !!options.force,
    },
  });

  const result = {
    sourcesFetched,
    sourcesFailed,
    clubSourcesFetched,
    eventsUpserted,
    eventsMarkedPast: stale.length,
    eventsDeleted: deleted.length,
    maxSources,
  };

  console.log("[collector] Done:", result);
  return result;
}
