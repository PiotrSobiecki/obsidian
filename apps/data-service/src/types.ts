import type { Ai, DurableObjectNamespace, Fetcher } from "@cloudflare/workers-types";

export type WorkerBindings = {
  HYPERDRIVE: { connectionString: string };
  DATABASE_URL?: string;
  AI: Ai;
  BROWSER: Fetcher;
  DISCOVERY_AGENT: DurableObjectNamespace;
  COLLECTOR_AGENT: DurableObjectNamespace;
  BRAVE_SEARCH_API_KEY?: string;
  API_KEY?: string;
  ENVIRONMENT?: string;
};
