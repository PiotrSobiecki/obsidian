import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { cities, cityBatchQueue, ingestionRuns, sources } from "../db/schema";
import { searchWeb } from "../tools/web-search";
import { fetchPage, stripHtml } from "../tools/fetch-page";
import { classifySearchResult, resolveSourceStatus } from "../tools/parse-events";
import { buildDiscoveryQueries } from "../lib/genre-policy";
import type { WorkerBindings } from "../types";

// Mało miast na przebieg — przy 50 wynikach/zapytanie i limicie Brave 1/s
// jeden batch musi domknąć się w limitach Workera. Kolejka rotuje po miastach
// (lastProcessedAt NULLS FIRST), więc z tygodnia na tydzień pokryje wszystkie.
export const DISCOVERY_BATCH_SIZE = 3;

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

export async function executeDiscovery(env: WorkerBindings) {
  const db = getDb(env);
  const startedAt = new Date();
  let sourcesAdded = 0;
  let citiesProcessed = 0;
  let venuesChecked = 0;
  let venuesDeactivated = 0;

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

  const apiKey = env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    console.warn(
      "[discovery] Brak BRAVE_SEARCH_API_KEY — tylko weryfikacja klubów, bez Brave Search"
    );
  }

  console.log(`[discovery] Start: ${cityBatch.length} miast`);

  for (const { cityId, cityName, citySlug } of cityBatch) {
    citiesProcessed++;

    const verify = await verifyCityClubSources(db, cityId, env);
    venuesChecked += verify.venuesChecked;
    venuesDeactivated += verify.venuesDeactivated;

    if (apiKey) {
      const queries = buildDiscoveryQueries(cityName, citySlug);
      console.log(`[discovery] Brave Search: ${cityName} (${queries.length} zapytań)`);

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
  }

  await db.insert(ingestionRuns).values({
    agentType: "discovery",
    startedAt,
    finishedAt: new Date(),
    statsJson: {
      citiesProcessed,
      sourcesAdded,
      venuesChecked,
      venuesDeactivated,
      batchSize: DISCOVERY_BATCH_SIZE,
      braveSearch: !!apiKey,
    },
  });

  const result = {
    citiesProcessed,
    sourcesAdded,
    venuesChecked,
    venuesDeactivated,
  };
  console.log("[discovery] Done:", result);
  return result;
}
