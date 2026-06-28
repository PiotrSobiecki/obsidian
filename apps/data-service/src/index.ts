import type { MessageBatch } from "@cloudflare/workers-types";
import app from "./app";
import { CollectorAgent } from "./agents/collector-agent";
import { DiscoveryAgent } from "./agents/discovery-agent";
import {
  collectSource,
  enqueueCollection,
  executeCollection,
  runCollectionCleanup,
} from "./cron/daily-collect";
import { discoverCity, enqueueDiscovery } from "./cron/weekly-discovery";
import type {
  CollectSourceMessage,
  DiscoveryCityMessage,
  WorkerBindings,
} from "./types";

export { DiscoveryAgent } from "./agents/discovery-agent";
export { CollectorAgent } from "./agents/collector-agent";

export default {
  async fetch(request: Request, env: WorkerBindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  // Consumer kolejek. Rozróżniamy po batch.queue:
  //  - obsidian-discovery: 1 komunikat = 1 miasto (limit Brave 1/s).
  //  - obsidian-collect:   1 komunikat = 1 źródło (fetch + parse + upsert).
  async queue(
    batch: MessageBatch<DiscoveryCityMessage | CollectSourceMessage>,
    env: WorkerBindings
  ) {
    if (batch.queue.startsWith("obsidian-collect")) {
      const now = new Date();
      for (const message of batch.messages) {
        const body = message.body as CollectSourceMessage;
        try {
          await collectSource(
            env,
            {
              id: body.sourceId,
              url: body.url,
              type: body.type,
              platform: body.platform,
              cityId: body.cityId,
              citySlug: body.citySlug,
              cityName: body.cityName,
            },
            now
          );
          message.ack();
        } catch (error) {
          console.error(`[queue] collectSource ${body.url} błąd:`, error);
          message.retry();
        }
      }
      return;
    }

    for (const message of batch.messages) {
      const body = message.body as DiscoveryCityMessage;
      try {
        await discoverCity(env, body);
        message.ack();
      } catch (error) {
        console.error(`[queue] discoverCity ${body.cityName} błąd:`, error);
        message.retry();
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: WorkerBindings) {
    const cron = event.cron;
    console.log(`[scheduled] Triggered: cron="${cron}"`);

    try {
      if (cron === "0 3 * * 1") {
        // Producer: wrzuca wszystkie miasta do kolejki, consumer je przerobi.
        const enqueued = await enqueueDiscovery(env);
        console.log(`[scheduled] Discovery: wrzucono ${enqueued} miast do kolejki`);
      } else if (cron === "0 5 * * *") {
        // Producer: wrzuca wszystkie uprawnione źródła do kolejki collect,
        // consumer obrabia je po kilka/wywołanie. Sprzątanie (past/delete) lecą
        // tu, bo są czas-zależne i niezależne od samej zbiórki.
        const enqueued = await enqueueCollection(env);
        const cleanup = await runCollectionCleanup(env, { sourcesEnqueued: enqueued });
        console.log(
          `[scheduled] Collector: wrzucono ${enqueued} źródeł do kolejki`,
          cleanup
        );
      } else if (env.ENVIRONMENT === "development") {
        console.log(`[scheduled] Nieznany cron w dev — uruchamiam collector`);
        await executeCollection(env, { maxSources: 5 });
      } else {
        console.warn(`[scheduled] Nieobsługiwany cron: "${cron}"`);
      }
    } catch (error) {
      console.error("[scheduled] Błąd:", error);
      throw error;
    }
  },
};
