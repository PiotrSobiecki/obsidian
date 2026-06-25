import { desc, and, asc, count, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb } from "./db/client";
import { cities, events, ingestionRuns, sources, venues } from "./db/schema";
import { executeCollection } from "./cron/daily-collect";
import { executeDiscovery } from "./cron/weekly-discovery";
import { resolveEventDateRange } from "./lib/date-range";
import { hasEventSource } from "./lib/real-events";
import { sanitizeTicketUrl, ticketProviderLabel } from "./lib/ticket-url";
import type { WorkerBindings } from "./types";

const app = new Hono<{ Bindings: WorkerBindings }>();

app.use(
  "/*",
  cors({
    origin: [
      "https://obsidian.pages.dev",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

function requireAdmin(c: { req: { header: (name: string) => string | undefined }; env: WorkerBindings }) {
  const apiKey = c.req.header("x-api-key");
  if (c.env.API_KEY && apiKey !== c.env.API_KEY) {
    return false;
  }
  return true;
}

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/cities", async (c) => {
  try {
    const db = getDb(c.env);
    const now = new Date();

    const rows = await db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        voivodeship: cities.voivodeship,
        upcomingCount: count(events.id),
      })
      .from(cities)
      .leftJoin(
        events,
        and(
          eq(events.cityId, cities.id),
          eq(events.status, "active"),
          gte(events.startsAt, now),
          hasEventSource
        )
      )
      .groupBy(cities.id)
      .orderBy(desc(cities.priority));

    return c.json({ cities: rows });
  } catch (error) {
    console.error("GET /cities error:", error);
    return c.json({ error: "Database unavailable" }, 503);
  }
});

app.get("/events", async (c) => {
  const citySlug = c.req.query("city");
  const from = c.req.query("from");
  const to = c.req.query("to");
  const range = c.req.query("range");

  if (!citySlug) {
    return c.json({ error: "city parameter required" }, 400);
  }

  try {
    const db = getDb(c.env);

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.slug, citySlug))
      .limit(1);

    if (!city) {
      return c.json({ error: "City not found" }, 404);
    }

    const { dateFrom, dateTo } = resolveEventDateRange(from, to, range);
    const now = new Date();
    const effectiveFrom = dateFrom > now ? dateFrom : now;

    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        artists: events.artistsJson,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        ticketUrl: events.ticketUrl,
        priceMin: events.priceMin,
        priceMax: events.priceMax,
        status: events.status,
        venueName: venues.name,
        venueAddress: venues.address,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(events)
      .innerJoin(cities, eq(events.cityId, cities.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(
        and(
          eq(events.cityId, city.id),
          eq(events.status, "active"),
          hasEventSource,
          gte(events.startsAt, effectiveFrom),
          lte(events.startsAt, dateTo)
        )
      )
      .orderBy(asc(events.startsAt));

    return c.json({
      city: { name: city.name, slug: city.slug },
      from: effectiveFrom.toISOString(),
      to: dateTo.toISOString(),
      events: rows.map((row) => {
        const ticketUrl = sanitizeTicketUrl(row.ticketUrl);
        return {
          ...row,
          ticketUrl,
          ticketProvider: ticketUrl ? ticketProviderLabel(ticketUrl) : null,
        };
      }),
    });
  } catch (error) {
    console.error("GET /events error:", error);
    return c.json({ error: "Database unavailable" }, 503);
  }
});

app.get("/events/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const db = getDb(c.env);

    const [row] = await db
      .select({
        id: events.id,
        title: events.title,
        artists: events.artistsJson,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        ticketUrl: events.ticketUrl,
        priceMin: events.priceMin,
        priceMax: events.priceMax,
        status: events.status,
        venueName: venues.name,
        venueAddress: venues.address,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(events)
      .innerJoin(cities, eq(events.cityId, cities.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(eq(events.id, id), hasEventSource))
      .limit(1);

    if (!row) {
      return c.json({ error: "Event not found" }, 404);
    }

    const ticketUrl = sanitizeTicketUrl(row.ticketUrl);

    return c.json({
      event: {
        ...row,
        ticketUrl,
        ticketProvider: ticketUrl ? ticketProviderLabel(ticketUrl) : null,
      },
    });
  } catch (error) {
    console.error("GET /events/:id error:", error);
    return c.json({ error: "Database unavailable" }, 503);
  }
});

app.get("/admin/sources", async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = getDb(c.env);

    const rows = await db
      .select({
        id: sources.id,
        url: sources.url,
        type: sources.type,
        platform: sources.platform,
        status: sources.status,
        trustScore: sources.trustScore,
        lastFetchedAt: sources.lastFetchedAt,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(sources)
      .innerJoin(cities, eq(sources.cityId, cities.id))
      .orderBy(sql`${sources.lastFetchedAt} DESC NULLS LAST`);

    return c.json({ sources: rows });
  } catch (error) {
    console.error("GET /admin/sources error:", error);
    return c.json({ error: "Database unavailable" }, 503);
  }
});

app.get("/admin/ingestion-runs", async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(ingestionRuns)
      .orderBy(sql`${ingestionRuns.startedAt} DESC`)
      .limit(50);

    return c.json({ runs: rows });
  } catch (error) {
    console.error("GET /admin/ingestion-runs error:", error);
    return c.json({ error: "Database unavailable" }, 503);
  }
});

app.post("/admin/collect", async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const force = c.req.query("force") === "1";
  const limitRaw = c.req.query("limit");
  const maxSources = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
  const asyncRun = c.req.query("async") === "1";

  if (limitRaw && (!maxSources || maxSources < 1 || maxSources > 50)) {
    return c.json({ error: "limit must be between 1 and 50" }, 400);
  }

  const options = { force, maxSources };

  if (asyncRun) {
    const startedAt = new Date().toISOString();
    c.executionCtx.waitUntil(
      executeCollection(c.env, options).catch((error) => {
        console.error("POST /admin/collect async error:", error);
      })
    );
    return c.json({ ok: true, status: "started", startedAt }, 202);
  }

  try {
    const result = await executeCollection(c.env, options);
    return c.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /admin/collect error:", error);
    return c.json({ error: "Collection failed" }, 500);
  }
});

app.post("/admin/discover", async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const asyncRun = c.req.query("async") === "1";

  if (asyncRun) {
    const startedAt = new Date().toISOString();
    c.executionCtx.waitUntil(
      executeDiscovery(c.env).catch((error) => {
        console.error("POST /admin/discover async error:", error);
      })
    );
    return c.json({ ok: true, status: "started", startedAt, agentType: "discovery" }, 202);
  }

  try {
    const result = await executeDiscovery(c.env);
    return c.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /admin/discover error:", error);
    return c.json({ error: "Discovery failed" }, 500);
  }
});

export default app;
