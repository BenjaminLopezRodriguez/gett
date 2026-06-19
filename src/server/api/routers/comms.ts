import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { caseProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  caseContactRoleEnum,
  caseContacts,
  caseMessages,
  cases,
} from "@/server/db/schema";
import { buildSmsUrl } from "@/lib/comms/sms-url";
import { TEMPLATES, type TemplateId } from "@/lib/comms/templates";
import { createHandoffToken } from "@/server/intake/handoff";
import { logCaseEvent } from "@/server/services/cases";

export const commsRouter = createTRPCRouter({
  getCaseContacts: caseProcedure("viewer").query(async ({ ctx }) => {
    return ctx.db.query.caseContacts.findMany({
      where: eq(caseContacts.caseId, ctx.caseId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }),

  upsertCaseContact: caseProcedure("member")
    .input(
      z.object({
        role: z.enum(caseContactRoleEnum.enumValues),
        phoneE164: z.string().min(7).max(20),
        displayName: z.string().min(1).max(256),
        smsConsentAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [contact] = await ctx.db
        .insert(caseContacts)
        .values({
          caseId: ctx.caseId,
          role: input.role,
          phoneE164: input.phoneE164,
          displayName: input.displayName,
          smsConsentAt: input.smsConsentAt,
        })
        .onConflictDoUpdate({
          target: [caseContacts.caseId, caseContacts.phoneE164, caseContacts.role],
          set: {
            displayName: input.displayName,
            smsConsentAt: input.smsConsentAt,
          },
        })
        .returning();
      return contact!;
    }),

  buildMessageTemplate: caseProcedure("member")
    .input(
      z.object({
        templateId: z.enum(["secure_upload", "reminder"] as const),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientContact = await ctx.db.query.caseContacts.findFirst({
        where: (t, { and, eq: eqFn }) =>
          and(eqFn(t.caseId, ctx.caseId), eqFn(t.role, "client")),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      if (!clientContact) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No client contact found for this case. Add one first.",
        });
      }

      const caseRow = await ctx.db.query.cases.findFirst({
        where: eq(cases.id, ctx.caseId),
      });
      if (!caseRow) throw new TRPCError({ code: "NOT_FOUND" });

      const { raw, expiresAt } = await createHandoffToken({
        channel: "sms",
        intent: "upload",
        caseId: ctx.caseId,
      });

      const handoffUrl = `${env.SITE_URL}/start?t=${raw}`;
      const previewBody = TEMPLATES[input.templateId as TemplateId](
        caseRow.caseHash,
        handoffUrl,
      );
      const smsUrl = buildSmsUrl(clientContact.phoneE164, previewBody);

      await logCaseEvent(ctx.caseId, ctx.user.id, "comms.template_prepared", {
        templateId: input.templateId,
      });

      return { previewBody, smsUrl, handoffUrl, expiresAt };
    }),

  sendSms: caseProcedure("member")
    .input(
      z.object({
        body: z.string().min(1).max(1600),
        templateId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        !env.TWILIO_ACCOUNT_SID ||
        !env.TWILIO_AUTH_TOKEN ||
        !env.TWILIO_PHONE_NUMBER
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
        });
      }

      const clientContact = await ctx.db.query.caseContacts.findFirst({
        where: (t, { and, eq: eqFn }) =>
          and(eqFn(t.caseId, ctx.caseId), eqFn(t.role, "client")),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });
      if (!clientContact) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No client contact found for this case.",
        });
      }

      const auth = Buffer.from(
        `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
      ).toString("base64");
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: new URLSearchParams({
            To: clientContact.phoneE164,
            From: env.TWILIO_PHONE_NUMBER,
            Body: input.body,
          }).toString(),
        },
      );

      if (!res.ok) {
        const detail = await res.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Twilio error: ${detail}`,
        });
      }

      await ctx.db.insert(caseMessages).values({
        caseId: ctx.caseId,
        direction: "out",
        templateId: input.templateId,
        channel: "sms",
        actorId: ctx.user.id,
      });
      await logCaseEvent(ctx.caseId, ctx.user.id, "comms.sms_sent", {
        templateId: input.templateId,
      });
    }),

  logOutboundComms: caseProcedure("member")
    .input(
      z.object({
        templateId: z.string().min(1),
        channel: z.enum(["sms", "call"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(caseMessages).values({
        caseId: ctx.caseId,
        direction: "out",
        templateId: input.templateId,
        channel: input.channel,
        actorId: ctx.user.id,
      });
      await logCaseEvent(ctx.caseId, ctx.user.id, "comms.sent", {
        templateId: input.templateId,
        channel: input.channel,
      });
    }),

  getCaseMessages: caseProcedure("viewer").query(async ({ ctx }) => {
    return ctx.db.query.caseMessages.findMany({
      where: eq(caseMessages.caseId, ctx.caseId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }),
});
