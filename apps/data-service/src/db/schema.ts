import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  voivodeship: varchar("voivodeship", { length: 50 }).notNull(),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("venues_city_id_idx").on(t.cityId)]
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    url: text("url").notNull().unique(),
    type: varchar("type", { length: 20 }).notNull(),
    platform: varchar("platform", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull().default("pending_review"),
    trustScore: real("trust_score").notNull().default(0.5),
    lastDiscoveredAt: timestamp("last_discovered_at", { withTimezone: true }),
    lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("sources_city_id_idx").on(t.cityId),
    index("sources_status_idx").on(t.status),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    title: varchar("title", { length: 500 }).notNull(),
    artistsJson: jsonb("artists_json").$type<string[]>().notNull().default([]),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    ticketUrl: text("ticket_url"),
    priceMin: integer("price_min"),
    priceMax: integer("price_max"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    fingerprint: varchar("fingerprint", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("events_city_starts_at_idx").on(t.cityId, t.startsAt),
    index("events_fingerprint_idx").on(t.fingerprint),
    index("events_status_idx").on(t.status),
  ]
);

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentType: varchar("agent_type", { length: 30 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  statsJson: jsonb("stats_json").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cityBatchQueue = pgTable(
  "city_batch_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    agentType: varchar("agent_type", { length: 30 }).notNull(),
    lastProcessedAt: timestamp("last_processed_at", { withTimezone: true }),
    batchOrder: integer("batch_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("city_batch_queue_city_agent_unique").on(t.cityId, t.agentType),
  ]
);

export type City = typeof cities.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Event = typeof events.$inferSelect;
export type IngestionRun = typeof ingestionRuns.$inferSelect;
