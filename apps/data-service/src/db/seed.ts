import { isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnvTarget, parseEnvTarget } from "./load-env";
import * as schema from "./schema";
import { cityBatchQueue, cities, events, sources } from "./schema";
import { POLISH_CITIES } from "./seed-data/cities";
import { CLUB_SOURCES } from "./seed-data/club-sources";
import { FESTIVAL_SOURCES } from "./seed-data/festival-sources";
import { SEED_SOURCES } from "./seed-data/sources";

const ALL_SEED_SOURCES = [...CLUB_SOURCES, ...FESTIVAL_SOURCES, ...SEED_SOURCES];
const target = parseEnvTarget();
const envFile = loadEnvTarget(target);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(`DATABASE_URL is required — ustaw w ${envFile}`);
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

const cityIdBySlug = new Map<string, string>();

for (const city of POLISH_CITIES) {
  const [row] = await db
    .insert(cities)
    .values(city)
    .onConflictDoUpdate({
      target: cities.slug,
      set: {
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        voivodeship: city.voivodeship,
        priority: city.priority,
      },
    })
    .returning();

  cityIdBySlug.set(city.slug, row.id);

  await db
    .insert(cityBatchQueue)
    .values({
      cityId: row.id,
      agentType: "discovery",
      batchOrder: 100 - city.priority,
    })
    .onConflictDoNothing();

  await db
    .insert(cityBatchQueue)
    .values({
      cityId: row.id,
      agentType: "collector",
      batchOrder: 100 - city.priority,
    })
    .onConflictDoNothing();
}

for (const source of ALL_SEED_SOURCES) {
  const cityId = cityIdBySlug.get(source.citySlug);
  if (!cityId) continue;

  const isClub = source.type === "venue";

  await db
    .insert(sources)
    .values({
      cityId,
      url: source.url,
      type: source.type,
      platform: source.platform,
      status: "active",
      trustScore: source.trustScore,
      lastDiscoveredAt: new Date(),
    })
    .onConflictDoUpdate({
      target: sources.url,
      set: {
        type: source.type,
        platform: source.platform,
        status: "active",
        trustScore: source.trustScore,
        ...(isClub ? { lastDiscoveredAt: new Date() } : {}),
      },
    });
}

// UWAGA: NIE gasimy tu źródeł spoza seedu. Wcześniej `notInArray(url, seedUrls)`
// ustawiał WSZYSTKIE discovered sources (setki klubów/festiwali znalezionych przez
// Discovery) na inactive przy każdym reseedzie — przez co Collector tracił 90%+
// pokrycia. Reseed ma tylko (re)tworzyć seed + miasta, a nie kasować dorobek
// Discovery. Stare, usunięte z seedu URL-e dezaktywuj ręcznie, jeśli zajdzie potrzeba.

const removed = await db
  .delete(events)
  .where(isNull(events.sourceId))
  .returning({ id: events.id });

const purged = await db
  .delete(events)
  .where(
    or(
      sql`${events.ticketUrl} ~* '/(klasyka|opera|teatr|musicale|musical|zwiedzanie|sport|dzieci|dziecko|stand-up|kabaret|wesele|imprezy|film|kino|muzea|komedia|dramat|tragedia)/'`,
      sql`${events.ticketUrl} ~* '/muzyka/(pop|jazz|blues|hip-hop|rap|rnb|disco|techno|house|trance|edm|folk|world|elektroniczna|dance|country)/'`,
      sql`(${events.ticketUrl} IS NOT NULL AND ${events.ticketUrl} NOT LIKE '%/muzyka/rock/%' AND ${events.ticketUrl} NOT LIKE '%/muzyka/metal/%' AND ${events.ticketUrl} NOT LIKE '%/muzyka/hardcore/%' AND ${events.ticketUrl} NOT LIKE '%/muzyka/punk/%' AND ${events.ticketUrl} NOT LIKE '%/muzyka/alternative/%' AND ${events.ticketUrl} NOT LIKE '%/festiwal%' AND ${events.ticketUrl} LIKE '%ebilet.pl%')`
    )
  )
  .returning({ id: events.id });

console.log(
  `Seeded ${POLISH_CITIES.length} cities, ${ALL_SEED_SOURCES.length} sources; usunięto ${removed.length} demo, ${purged.length} spoza rock/metal`
);

await client.end();
console.log("Seed complete");
