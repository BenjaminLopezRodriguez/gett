import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { requireCaseMember } from "@/server/auth/case-access";
import { db } from "@/server/db";
import { appendCaseEvent } from "@/server/lib/audit";
import { createCase, getCaseForUser } from "@/server/services/cases";

export function buildAgentTools(userId: string) {
  return [
    new DynamicStructuredTool({
      name: "create_case",
      description: "Create a new compliance case with a unique case hash",
      schema: z.object({
        title: z.string(),
        metadata: z.record(z.unknown()).optional(),
      }),
      func: async ({ title, metadata }) => {
        const c = await createCase(userId, title, metadata);
        return JSON.stringify({
          caseId: c.id,
          caseHash: c.caseHash,
          title: c.title,
        });
      },
    }),
    new DynamicStructuredTool({
      name: "get_case",
      description: "Get case details if the user is authorized",
      schema: z.object({ caseId: z.string().uuid() }),
      func: async ({ caseId }) => {
        const c = await getCaseForUser(caseId, userId);
        return JSON.stringify({
          id: c.id,
          caseHash: c.caseHash,
          title: c.title,
          status: c.status,
          metadata: c.metadata,
        });
      },
    }),
    new DynamicStructuredTool({
      name: "append_audit_event",
      description: "Append a verifiable audit event to a case",
      schema: z.object({
        caseId: z.string().uuid(),
        action: z.string(),
        payload: z.record(z.unknown()).optional(),
      }),
      func: async ({ caseId, action, payload }) => {
        await requireCaseMember(db, userId, caseId, "member");
        await appendCaseEvent(db, {
          caseId,
          actorId: userId,
          action,
          payload: payload ?? {},
        });
        return JSON.stringify({ ok: true });
      },
    }),
    new DynamicStructuredTool({
      name: "read_document_text",
      description: "Read extracted text from an uploaded document",
      schema: z.object({
        caseId: z.string().uuid(),
        documentId: z.string().uuid(),
      }),
      func: async ({ caseId, documentId }) => {
        await requireCaseMember(db, userId, caseId, "viewer");
        const doc = await db.query.documents.findFirst({
          where: (documents, { and, eq }) =>
            and(
              eq(documents.id, documentId),
              eq(documents.caseId, caseId),
            ),
        });
        if (!doc) return JSON.stringify({ error: "not_found" });
        return JSON.stringify({
          filename: doc.filename,
          sha256: doc.sha256,
          text: doc.extractedText ?? "",
        });
      },
    }),
  ];
}

/** @deprecated alias */
export const createAgentTools = buildAgentTools;
