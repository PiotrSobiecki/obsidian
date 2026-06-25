import { Agent } from "agents";
import { executeDiscovery } from "../cron/weekly-discovery";
import type { WorkerBindings } from "../types";

type DiscoveryState = {
  lastRunAt: string | null;
  citiesProcessed: number;
};

export class DiscoveryAgent extends Agent<WorkerBindings, DiscoveryState> {
  initialState: DiscoveryState = {
    lastRunAt: null,
    citiesProcessed: 0,
  };

  async runDiscovery() {
    const result = await executeDiscovery(this.env);
    this.setState({
      lastRunAt: new Date().toISOString(),
      citiesProcessed: this.state.citiesProcessed + result.citiesProcessed,
    });
    return result;
  }
}

export async function runWeeklyDiscovery(env: WorkerBindings) {
  const id = env.DISCOVERY_AGENT.idFromName("discovery-main");
  const stub = env.DISCOVERY_AGENT.get(id) as DurableObjectStub & {
    runDiscovery(): Promise<{ citiesProcessed: number; sourcesAdded: number }>;
  };
  return stub.runDiscovery();
}
