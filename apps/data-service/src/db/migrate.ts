import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnvTarget, parseEnvTarget } from "./load-env";

const target = parseEnvTarget();
const envFile = loadEnvTarget(target);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(`DATABASE_URL is required — ustaw w ${envFile}`);
  process.exit(1);
}

console.log(`Applying migrations (${target})…`);

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log(`Migrations applied (${target})`);
await client.end();
