import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { TRPCError } from "@trpc/server";

import { env } from "@/env";
import {
  examinationOutputSchema,
  intakeOutputSchema,
  type ExaminationOutput,
  type IntakeOutput,
} from "@/server/agents/schemas";
import { buildAgentTools } from "@/server/agents/tools";
import { requireCaseMember } from "@/server/auth/case-access";
import { db } from "@/server/db";
import { logCaseEvent } from "@/server/services/cases";

function getModel() {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new ChatAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: "claude-sonnet-4-20250514",
    temperature: 0,
  });
}

export async function runIntakeAgent(
  userId: string,
  messages: string[],
  caseId?: string,
): Promise<IntakeOutput> {
  if (caseId) {
    await requireCaseMember(db, userId, caseId, "member");
  }

  const model = getModel();
  if (!model) {
    return {
      summary: "Intake stub — configure ANTHROPIC_API_KEY for live processing.",
      leaveType: "unknown",
      urgency: "medium",
      missingDocuments: ["Configure ANTHROPIC_API_KEY for live intake"],
      recommendedNextSteps: ["Complete intake manually"],
      caseId,
    };
  }

  const structured = model.withStructuredOutput(intakeOutputSchema);
  const tools = buildAgentTools(userId);

  const result = await structured.invoke([
    new SystemMessage(
      `You are a medical leave compliance intake agent for gett. Be precise, cite what information is missing, and never invent medical facts. Available tools: ${tools.map((t) => t.name).join(", ")}.`,
    ),
    new HumanMessage(messages.join("\n\n")),
  ]);

  if (caseId) {
    await logCaseEvent(caseId, userId, "agent.intake.completed", {
      leaveType: result.leaveType,
      urgency: result.urgency,
    });
  }

  return { ...result, caseId: caseId ?? result.caseId };
}

export async function runSummaryAgent(
  userId: string,
  caseId: string,
): Promise<{ summary: string }> {
  await requireCaseMember(db, userId, caseId, "viewer");

  const caseRow = await db.query.cases.findFirst({
    where: (cases, { eq }) => eq(cases.id, caseId),
  });
  const docs = await db.query.documents.findMany({
    where: (documents, { eq }) => eq(documents.caseId, caseId),
  });

  const model = getModel();
  if (!model) {
    const summary = `[agent stub] Summary for case ${caseId}. Configure ANTHROPIC_API_KEY for live output.`;
    await logCaseEvent(caseId, userId, "agent.summary.completed", {
      summaryLength: summary.length,
      stub: true,
    });
    return { summary };
  }

  const response = await model.invoke([
    new SystemMessage(
      "Summarize this medical leave case for a compliance reviewer. Note gaps and verifiability concerns.",
    ),
    new HumanMessage(
      JSON.stringify({
        case: caseRow,
        documents: docs.map((d) => ({
          filename: d.filename,
          sha256: d.sha256,
          excerpt: d.extractedText?.slice(0, 2000),
        })),
      }),
    ),
  ]);

  const summary =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  await logCaseEvent(caseId, userId, "agent.summary.completed", {
    summaryLength: summary.length,
  });

  return { summary };
}

export async function runExamineDocumentAgent(
  userId: string,
  caseId: string,
  documentId: string,
): Promise<ExaminationOutput> {
  await requireCaseMember(db, userId, caseId, "member");

  const doc = await db.query.documents.findFirst({
    where: (documents, { and, eq }) =>
      and(eq(documents.id, documentId), eq(documents.caseId, caseId)),
  });

  if (!doc) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
  }

  const model = getModel();
  if (!model) {
    const stub: ExaminationOutput = {
      compliant: false,
      flags: [
        {
          severity: "warning",
          message: "ANTHROPIC_API_KEY not configured — examination stub only",
        },
      ],
      summary: `Stub examination for ${doc.filename}`,
    };
    await logCaseEvent(caseId, userId, "agent.examination.completed", {
      documentId,
      stub: true,
    });
    return stub;
  }

  const structured = model.withStructuredOutput(examinationOutputSchema);
  const result = await structured.invoke([
    new SystemMessage(
      "Examine this medical leave document for compliance issues. Include citation placeholders referencing document sections when possible.",
    ),
    new HumanMessage(
      JSON.stringify({
        filename: doc.filename,
        sha256: doc.sha256,
        text: doc.extractedText,
      }),
    ),
  ]);

  await logCaseEvent(caseId, userId, "agent.examination.completed", {
    documentId,
    compliant: result.compliant,
    flagCount: result.flags.length,
  });

  return result;
}
