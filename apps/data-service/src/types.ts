import type {
  Ai,
  DurableObjectNamespace,
  Fetcher,
  Queue,
} from "@cloudflare/workers-types";

/** Jeden komunikat kolejki discovery = jedno miasto do przetworzenia. */
export type DiscoveryCityMessage = {
  cityId: string;
  cityName: string;
  citySlug: string;
};

export type WorkerBindings = {
  HYPERDRIVE: { connectionString: string };
  DATABASE_URL?: string;
  AI: Ai;
  BROWSER: Fetcher;
  DISCOVERY_AGENT: DurableObjectNamespace;
  COLLECTOR_AGENT: DurableObjectNamespace;
  DISCOVERY_QUEUE: Queue<DiscoveryCityMessage>;
  BRAVE_SEARCH_API_KEY?: string;
  API_KEY?: string;
  ENVIRONMENT?: string;
};
