import { z } from "zod";

import {
  caseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { requireCaseMember } from "@/server/auth/case-access";
import { caseMemberRoleEnum } from "@/server/db/schema";
import {
  addCaseMember,
  createCase,
  getCaseEvents,
  getCaseForUser,
  listCasesForUser,
} from "@/server/services/cases";

export const caseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(512),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await createCase(
        ctx.user.id,
        input.title,
        input.metadata,
      );
      return {
        id: created.id,
        caseHash: created.caseHash,
        title: created.title,
        status: created.status,
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await listCasesForUser(ctx.user.id);
    return rows.map((c) => ({
      id: c.id,
      caseHash: c.caseHash,
      title: c.title,
      status: c.status,
      updatedAt: c.updatedAt,
    }));
  }),

  get: caseProcedure().query(async ({ ctx, input }) => {
    const row = await getCaseForUser(input.caseId, ctx.user.id);
    return {
      id: row.id,
      caseHash: row.caseHash,
      title: row.title,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }),

  addMember: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(caseMemberRoleEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "owner");
      return addCaseMember(
        ctx.user.id,
        input.caseId,
        input.userId,
        input.role,
      );
    }),

  auditLog: caseProcedure().query(async ({ ctx, input }) => {
    return getCaseEvents(input.caseId, ctx.user.id);
  }),
});
