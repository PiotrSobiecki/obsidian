import type { MessageBatch } from "@cloudflare/workers-types";
import app from "./app";
import { CollectorAgent, runDailyCollect } from "./agents/collector-agent";
import { DiscoveryAgent } from "./agents/discovery-agent";
import { executeCollection } from "./cron/daily-collect";
import { discoverCity, enqueueDiscovery } from "./cron/weekly-discovery";
import type { DiscoveryCityMessage, WorkerBindings } from "./types";

export { DiscoveryAgent } from "./agents/discovery-agent";
export { CollectorAgent } from "./agents/collector-agent";

export default {
  async fetch(request: Request, env: WorkerBindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  // Consumer kolejki discovery — 1 komunikat = 1 miasto (max_concurrency=1
  // szanuje limit Brave 1/s, każde wywołanie ma własny budżet czasu).
  async queue(batch: MessageBatch<DiscoveryCityMessage>, env: WorkerBindings) {
    for (const message of batch.messages) {
      try {
        await discoverCity(env, message.body);
        message.ack();
      } catch (error) {
        console.error(`[queue] discoverCity ${message.body.cityName} błąd:`, error);
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
        try {
          await runDailyCollect(env);
        } catch (error) {
          console.warn("[scheduled] Collector DO failed, fallback:", error);
          await executeCollection(env);
        }
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
