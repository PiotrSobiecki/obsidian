import { defineConfig } from "drizzle-kit";
import {
  loadEnvTarget,
  parseEnvTarget,
  type EnvTarget,
} from "./src/db/load-env";

function resolveTarget(): EnvTarget {
  const fromEnv = process.env.DRIZZLE_ENV;
  if (fromEnv === "production" || fromEnv === "prod") return "production";
  if (fromEnv === "dev") return "dev";
  return parseEnvTarget();
}

const target = resolveTarget();
const envFile = loadEnvTarget(target);

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(`DATABASE_URL is required — ustaw w ${envFile}`);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
