CREATE TABLE IF NOT EXISTS "cities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL,
  "voivodeship" varchar(50) NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "venues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "city_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "address" text,
  "lat" double precision,
  "lng" double precision,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "city_id" uuid NOT NULL,
  "url" text NOT NULL,
  "type" varchar(20) NOT NULL,
  "platform" varchar(100),
  "status" varchar(20) DEFAULT 'pending_review' NOT NULL,
  "trust_score" real DEFAULT 0.5 NOT NULL,
  "last_discovered_at" timestamp with time zone,
  "last_fetched_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sources_url_unique" UNIQUE("url")
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "city_id" uuid NOT NULL,
  "venue_id" uuid,
  "source_id" uuid,
  "title" varchar(500) NOT NULL,
  "artists_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone,
  "ticket_url" text,
  "price_min" integer,
  "price_max" integer,
  "status" varchar(20) DEFAULT 'active' NOT NULL,
  "fingerprint" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_fingerprint_unique" UNIQUE("fingerprint")
);

CREATE TABLE IF NOT EXISTS "ingestion_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_type" varchar(30) NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "finished_at" timestamp with time zone,
  "stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "city_batch_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "city_id" uuid NOT NULL,
  "agent_type" varchar(30) NOT NULL,
  "last_processed_at" timestamp with time zone,
  "batch_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "city_batch_queue_city_agent_unique" UNIQUE("city_id","agent_type")
);

ALTER TABLE "venues" ADD CONSTRAINT "venues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sources" ADD CONSTRAINT "sources_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "events" ADD CONSTRAINT "events_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "events" ADD CONSTRAINT "events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "city_batch_queue" ADD CONSTRAINT "city_batch_queue_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "venues_city_id_idx" ON "venues" USING btree ("city_id");
CREATE INDEX IF NOT EXISTS "sources_city_id_idx" ON "sources" USING btree ("city_id");
CREATE INDEX IF NOT EXISTS "sources_status_idx" ON "sources" USING btree ("status");
CREATE INDEX IF NOT EXISTS "events_city_starts_at_idx" ON "events" USING btree ("city_id","starts_at");
CREATE INDEX IF NOT EXISTS "events_fingerprint_idx" ON "events" USING btree ("fingerprint");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" USING btree ("status");
