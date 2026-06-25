import { isNotNull } from "drizzle-orm";
import { events } from "../db/schema";

/** Wydarzenie zebranego przez collectora — bez demo ze seeda (source_id = null). */
export const hasEventSource = isNotNull(events.sourceId);
