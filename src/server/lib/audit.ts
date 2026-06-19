import type { db as Db } from "@/server/db";
import { caseEvents } from "@/server/db/schema";

type Database = typeof Db;

export async function appendCaseEvent(
  database: Database,
  input: {
    caseId: string;
    actorId: string | null;
    action: string;
    payload?: Record<string, unknown>;
  },
) {
  const [event] = await database
    .insert(caseEvents)
    .values({
      caseId: input.caseId,
      actorId: input.actorId,
      action: input.action,
      payload: input.payload ?? {},
    })
    .returning();

  return event!;
}
