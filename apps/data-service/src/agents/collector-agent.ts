import { Agent } from "agents";
import { executeCollection } from "../cron/daily-collect";
import type { WorkerBindings } from "../types";

type CollectorState = {
  lastRunAt: string | null;
  eventsUpserted: number;
};

export class CollectorAgent extends Agent<WorkerBindings, CollectorState> {
  initialState: CollectorState = {
    lastRunAt: null,
    eventsUpserted: 0,
  };

  async runCollection() {
    const result = await executeCollection(this.env);
    this.setState({
      lastRunAt: new Date().toISOString(),
      eventsUpserted: this.state.eventsUpserted + result.eventsUpserted,
    });
    return result;
  }
}

export async function runDailyCollect(env: WorkerBindings) {
  const id = env.COLLECTOR_AGENT.idFromName("collector-main");
  const stub = env.COLLECTOR_AGENT.get(id) as DurableObjectStub & {
    runCollection(): Promise<{
      sourcesFetched: number;
      eventsUpserted: number;
      eventsMarkedPast: number;
    }>;
  };
  return stub.runCollection();
}
