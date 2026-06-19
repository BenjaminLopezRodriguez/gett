import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { runAgent } from "@/server/agents/orchestrator";
import { agentTypeSchema } from "@/server/agents/prompts";
import {
  createCase,
  getCaseEvents,
  getCaseForUser,
  listCasesForUser,
  toTrpcError,
  updateCaseStatus,
} from "@/server/services/cases";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const casesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listCasesForUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        return await getCaseForUser(input.caseId, ctx.user.id);
      } catch (error) {
        toTrpcError(error);
      }
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      return createCase(ctx.user.id, input.title);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        status: z.enum([
          "draft",
          "intake",
          "in_review",
          "with_lawyer",
          "closed",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateCaseStatus(
          input.caseId,
          ctx.user.id,
          input.status,
        );
      } catch (error) {
        toTrpcError(error);
      }
    }),

  events: protectedProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        return await getCaseEvents(input.caseId, ctx.user.id);
      } catch (error) {
        toTrpcError(error);
      }
    }),

  runAgent: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid().nullable(),
        agentType: agentTypeSchema,
        input: z.string().min(1).max(8000),
        documentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await runAgent(
          input.caseId,
          ctx.user.id,
          input.agentType,
          input.input,
          input.documentId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        toTrpcError(error);
      }
    }),
});
