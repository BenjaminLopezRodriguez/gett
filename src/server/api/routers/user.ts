import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { users, userPersonaEnum } from "@/server/db/schema";
import {
  defaultCaseTitle,
  getDashboardPath,
} from "@/server/lib/persona";
import {
  getIntegrationStatus,
  getVerificationStatus,
} from "@/server/lib/setup-status";
import { createCase } from "@/server/services/cases";

const verificationPayloadSchema = z.record(z.unknown());

function resolveVerificationStatus(
  skipVerification: boolean,
  hasPayload: boolean,
  integrationConfigured: boolean,
): "skipped" | "pending" | "verified" | "unverified" {
  if (skipVerification) return "skipped";
  if (!hasPayload) return "unverified";
  if (integrationConfigured) return "pending";
  return "pending";
}

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      persona: user.persona,
      verificationStatus: user.verificationStatus,
      verificationPayload: user.verificationPayload,
      onboardingCompletedAt: user.onboardingCompletedAt,
      isOnboarded: !!user.onboardingCompletedAt && !!user.persona,
      dashboardPath: user.persona ? getDashboardPath(user.persona) : null,
    };
  }),

  getSetupStatus: publicProcedure.query(() => {
    return getIntegrationStatus();
  }),

  getVerificationStatus: protectedProcedure
    .input(z.object({ persona: z.enum(userPersonaEnum.enumValues) }))
    .query(({ input }) => getVerificationStatus(input.persona)),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        persona: z.enum(userPersonaEnum.enumValues),
        verificationPayload: verificationPayloadSchema.optional(),
        skipVerification: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (existing.onboardingCompletedAt && existing.persona) {
        return {
          redirectPath: getDashboardPath(existing.persona),
          caseId: null as string | null,
        };
      }

      const skipVerification = input.skipVerification ?? false;
      const hasPayload =
        !!input.verificationPayload &&
        Object.keys(input.verificationPayload).length > 0;
      const integration = getVerificationStatus(input.persona);
      const verificationStatus = resolveVerificationStatus(
        skipVerification,
        hasPayload,
        integration.configured,
      );

      const now = new Date();
      await ctx.db
        .update(users)
        .set({
          persona: input.persona,
          onboardingCompletedAt: now,
          verificationStatus,
          verificationPayload: hasPayload ? input.verificationPayload : null,
        })
        .where(eq(users.id, ctx.user.id));

      let caseId: string | null = null;
      const caseTitle = defaultCaseTitle(input.persona);
      if (caseTitle) {
        const created = await createCase(ctx.user.id, caseTitle, {
          persona: input.persona,
          verification: input.verificationPayload ?? {},
        });
        caseId = created.id;
      }

      return {
        redirectPath: getDashboardPath(input.persona),
        caseId,
      };
    }),

  submitVerification: protectedProcedure
    .input(
      z.object({
        payload: verificationPayloadSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (!existing.persona) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete onboarding before verifying",
        });
      }

      const integration = getVerificationStatus(existing.persona);
      const verificationStatus = resolveVerificationStatus(
        false,
        Object.keys(input.payload).length > 0,
        integration.configured,
      );

      await ctx.db
        .update(users)
        .set({
          verificationStatus,
          verificationPayload: input.payload,
        })
        .where(eq(users.id, ctx.user.id));

      return { verificationStatus };
    }),
});
