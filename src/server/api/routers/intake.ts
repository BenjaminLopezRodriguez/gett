import { z } from "zod";

import { env } from "@/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { requireCaseMember } from "@/server/auth/case-access";
import {
  consumeHandoffToken,
  createHandoffToken,
  validateHandoffToken,
} from "@/server/intake/handoff";
import { logCaseEvent } from "@/server/services/cases";

export const intakeRouter = createTRPCRouter({
  createHandoffLink: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid().optional(),
        intent: z.enum(["upload", "intake"]).default("upload"),
        phoneE164: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.caseId) {
        await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "member");
      }
      const { raw, expiresAt } = await createHandoffToken({
        channel: "web",
        intent: input.intent,
        phoneE164: input.phoneE164,
        caseId: input.caseId,
      });
      return { url: `${env.SITE_URL}/start?t=${raw}`, expiresAt };
    }),

  resolveHandoff: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const token = await validateHandoffToken(input.token);
      if (!token) {
        return { valid: false, expired: true, intent: null, minutesRemaining: 0 };
      }
      const minutesRemaining = Math.max(
        0,
        Math.floor((token.expiresAt.getTime() - Date.now()) / 60_000),
      );
      return {
        valid: true,
        expired: false,
        intent: token.intent,
        caseId: token.caseId ?? undefined,
        minutesRemaining,
      };
    }),

  consumeHandoff: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        caseId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await consumeHandoffToken(input.token, ctx.user.id);
      await logCaseEvent(input.caseId, ctx.user.id, "handoff.consumed", {
        intent: "upload",
      });
    }),
});
