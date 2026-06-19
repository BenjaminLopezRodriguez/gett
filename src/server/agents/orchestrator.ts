import "server-only";

import type { AgentType } from "@/server/agents/prompts";
import {
  runExamineDocumentAgent,
  runIntakeAgent,
  runSummaryAgent,
} from "@/server/agents/runner";
import { requireCaseMember } from "@/server/auth/case-access";
import { db } from "@/server/db";

export type AgentRunResult = {
  agentType: AgentType;
  output: string;
  caseId: string | null;
};

export async function runAgent(
  caseId: string | null,
  userId: string,
  agentType: AgentType,
  input: string,
  documentId?: string,
): Promise<AgentRunResult> {
  if (caseId) {
    await requireCaseMember(db, userId, caseId, "member");
  }

  switch (agentType) {
    case "intake": {
      const result = await runIntakeAgent(userId, [input], caseId ?? undefined);
      return {
        agentType,
        output: JSON.stringify(result, null, 2),
        caseId: result.caseId ?? caseId,
      };
    }
    case "summary": {
      if (!caseId) throw new Error("caseId required for summary agent");
      const result = await runSummaryAgent(userId, caseId);
      return { agentType, output: result.summary, caseId };
    }
    case "document_examination": {
      if (!caseId || !documentId) {
        throw new Error("caseId and documentId required for document examination");
      }
      const result = await runExamineDocumentAgent(userId, caseId, documentId);
      return {
        agentType,
        output: JSON.stringify(result, null, 2),
        caseId,
      };
    }
  }
}
