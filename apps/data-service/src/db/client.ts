import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Env = {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
};

export function getDb(env: Env) {
  const connectionString =
    env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL ?? "";

  if (!connectionString) {
    throw new Error("DATABASE_URL or HYPERDRIVE binding required");
  }

  const client = postgres(connectionString, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
