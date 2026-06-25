import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { cities, cityBatchQueue, ingestionRuns, sources } from "../db/schema";
import { searchWeb } from "../tools/web-search";
import { fetchPage, stripHtml } from "../tools/fetch-page";
import { classifySearchResult, resolveSourceStatus } from "../tools/parse-events";
import { buildDiscoveryQueries } from "../lib/genre-policy";
import type { DiscoveryCityMessage, WorkerBindings } from "../types";

// Inline /admin/discover bez kolejki — ile miast przerobić w jednym żądaniu.
// Główna ścieżka (cron) używa kolejki: 1 miasto = 1 wywołanie Workera.
export const DISCOVERY_BATCH_SIZE = 2;

async function verifyCityClubSources(
  db: ReturnType<typeof getDb>,
  cityId: string,
  env: WorkerBindings
) {
  let venuesChecked = 0;
  let venuesDeactivated = 0;

  const clubSources = await db
    .select({
      id: sources.id,
      url: sources.url,
      platform: sources.platform,
    })
    .from(sources)
    .where(
      and(
        eq(sources.cityId, cityId),
        eq(sources.type, "venue"),
        eq(sources.status, "active")
      )
    );

  for (const src of clubSources) {
    venuesChecked++;
    try {
      const html = await fetchPage(src.url, env.BROWSER);
      const text = stripHtml(html, 2000).toLowerCase();
      if (
        text.length < 80 ||
        /naprawa skrzyni biegów|lakiery bezbarwne|skubanie drobiu/i.test(text)
      ) {
        throw new Error("Podejrzana treść / pusty kalendarz");
      }
      console.log(`[discovery] Klub OK: ${src.platform} (${src.url})`);
    } catch (error) {
      venuesDeactivated++;
      await db
        .update(sources)
        .set({ status: "inactive" })
        .where(eq(sources.id, src.id));
      console.warn(`[discovery] Dezaktywowano klub ${src.url}:`, error);
    }
  }

  return { venuesChecked, venuesDeactivated };
}

/**
 * Przetwarza JEDNO miasto: weryfikacja klubów + Brave Search + klasyfikacja +
 * zapis nowych źródeł. Wołane per komunikat kolejki (1 miasto = 1 wywołanie),
 * więc mieści się w limitach Workera niezależnie od liczby miast.
 */
export async function discoverCity(
  env: WorkerBindings,
  city: DiscoveryCityMessage
) {
  const db = getDb(env);
  const startedAt = new Date();
  const { cityId, cityName, citySlug } = city;
  let sourcesAdded = 0;

  const verify = await verifyCityClubSources(db, cityId, env);

  const apiKey = env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn(
      `[discovery] ${cityName}: brak BRAVE_SEARCH_API_KEY — tylko weryfikacja klubów`
    );
  } else {
    const queries = buildDiscoveryQueries(cityName, citySlug);
    console.log(`[discovery] ${cityName}: ${queries.length} zapytań Brave`);

    for (const query of queries) {
      const results = await searchWeb(query, apiKey);
      await new Promise((r) => setTimeout(r, 300));

      for (const result of results) {
        try {
          const classified = await classifySearchResult(env.AI, result, cityName);
          if (!classified) continue;

          const existing = await db
            .select({ id: sources.id })
            .from(sources)
            .where(eq(sources.url, classified.url))
            .limit(1);

          if (existing.length > 0) continue;

          await db.insert(sources).values({
            cityId,
            url: classified.url,
            type: classified.type,
            platform: classified.platform,
            status: resolveSourceStatus(classified, result.url),
            trustScore: classified.trust_score,
            lastDiscoveredAt: new Date(),
          });

          sourcesAdded++;
          console.log(`[discovery] + źródło: ${classified.platform} ${classified.url}`);
        } catch (error) {
          console.warn(`[discovery] Pominięto wynik ${result.url}:`, error);
        }
      }
    }
  }

  await db
    .update(cityBatchQueue)
    .set({ lastProcessedAt: new Date() })
    .where(
      and(
        eq(cityBatchQueue.cityId, cityId),
        eq(cityBatchQueue.agentType, "discovery")
      )
    );

  await db.insert(ingestionRuns).values({
    agentType: "discovery",
    startedAt,
    finishedAt: new Date(),
    statsJson: {
      city: cityName,
      sourcesAdded,
      venuesChecked: verify.venuesChecked,
      venuesDeactivated: verify.venuesDeactivated,
      braveSearch: !!apiKey,
    },
  });

  const result = { cityName, sourcesAdded, ...verify };
  console.log("[discovery] Miasto gotowe:", result);
  return result;
}

/** Producer: wrzuca po jednym komunikacie na każde miasto do kolejki discovery. */
export async function enqueueDiscovery(env: WorkerBindings): Promise<number> {
  const db = getDb(env);

  const rows = await db
    .select({
      cityId: cityBatchQueue.cityId,
      cityName: cities.name,
      citySlug: cities.slug,
    })
    .from(cityBatchQueue)
    .innerJoin(cities, eq(cityBatchQueue.cityId, cities.id))
    .where(eq(cityBatchQueue.agentType, "discovery"))
    .orderBy(
      asc(cityBatchQueue.batchOrder),
      sql`${cityBatchQueue.lastProcessedAt} ASC NULLS FIRST`
    );

  const messages = rows.map((r) => ({
    body: { cityId: r.cityId, cityName: r.cityName, citySlug: r.citySlug },
  }));

  // sendBatch: maks. 100 komunikatów na żądanie.
  for (let i = 0; i < messages.length; i += 100) {
    await env.DISCOVERY_QUEUE.sendBatch(messages.slice(i, i + 100));
  }

  console.log(`[discovery] Wrzucono do kolejki ${messages.length} miast`);
  return messages.length;
}

/**
 * Inline discovery bez kolejki — przetwarza mały batch miast synchronicznie.
 * Używane przez /admin/discover do szybkich testów; cron używa kolejki.
 */
export async function executeDiscovery(env: WorkerBindings) {
  const db = getDb(env);

  const cityBatch = await db
    .select({
      cityId: cityBatchQueue.cityId,
      cityName: cities.name,
      citySlug: cities.slug,
    })
    .from(cityBatchQueue)
    .innerJoin(cities, eq(cityBatchQueue.cityId, cities.id))
    .where(eq(cityBatchQueue.agentType, "discovery"))
    .orderBy(
      asc(cityBatchQueue.batchOrder),
      sql`${cityBatchQueue.lastProcessedAt} ASC NULLS FIRST`
    )
    .limit(DISCOVERY_BATCH_SIZE);

  let citiesProcessed = 0;
  let sourcesAdded = 0;
  let venuesChecked = 0;
  let venuesDeactivated = 0;

  for (const city of cityBatch) {
    const r = await discoverCity(env, city);
    citiesProcessed++;
    sourcesAdded += r.sourcesAdded;
    venuesChecked += r.venuesChecked;
    venuesDeactivated += r.venuesDeactivated;
  }

  const result = { citiesProcessed, sourcesAdded, venuesChecked, venuesDeactivated };
  console.log("[discovery] Inline done:", result);
  return result;
}
