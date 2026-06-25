import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".dev.vars") });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const runs = await sql`
  SELECT agent_type, started_at, stats_json
  FROM ingestion_runs
  ORDER BY started_at DESC
  LIMIT 5
`;
const src = await sql`
  SELECT status, type, count(*)::int as c
  FROM sources
  GROUP BY status, type
  ORDER BY c DESC
`;
const ev = await sql`
  SELECT count(*)::int as c FROM events WHERE source_id IS NOT NULL
`;
const recentFetch = await sql`
  SELECT url, last_fetched_at, status, type
  FROM sources
  ORDER BY last_fetched_at DESC NULLS LAST
  LIMIT 5
`;

console.log("ingestion_runs:", JSON.stringify(runs, null, 2));
console.log("sources_by_type:", JSON.stringify(src, null, 2));
console.log("real_events:", ev[0].c);
console.log("recent_fetched:", JSON.stringify(recentFetch, null, 2));

await sql.end();
