import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  runExamineDocumentAgent,
  runIntakeAgent,
  runSummaryAgent,
} from "@/server/agents/runner";

export const agentRouter = createTRPCRouter({
  intake: protectedProcedure
    .input(
      z.object({
        messages: z.array(z.string().min(1)),
        caseId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return runIntakeAgent(
        ctx.user.id,
        input.messages,
        input.caseId,
      );
    }),

  summarize: protectedProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return runSummaryAgent(ctx.user.id, input.caseId);
    }),

  examineDocument: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        documentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return runExamineDocumentAgent(
        ctx.user.id,
        input.caseId,
        input.documentId,
      );
    }),
});
