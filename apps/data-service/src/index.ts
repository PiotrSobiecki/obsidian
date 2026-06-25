import app from "./app";
import { CollectorAgent, runDailyCollect } from "./agents/collector-agent";
import { DiscoveryAgent, runWeeklyDiscovery } from "./agents/discovery-agent";
import { executeCollection } from "./cron/daily-collect";
import { executeDiscovery } from "./cron/weekly-discovery";
import type { WorkerBindings } from "./types";

export { DiscoveryAgent } from "./agents/discovery-agent";
export { CollectorAgent } from "./agents/collector-agent";

export default {
  async fetch(request: Request, env: WorkerBindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: WorkerBindings) {
    const cron = event.cron;
    console.log(`[scheduled] Triggered: cron="${cron}"`);

    try {
      if (cron === "0 3 * * 1") {
        try {
          await runWeeklyDiscovery(env);
        } catch (error) {
          console.warn("[scheduled] Discovery DO failed, fallback:", error);
          await executeDiscovery(env);
        }
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
