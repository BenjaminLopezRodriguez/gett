import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { requireCaseMember } from "@/server/auth/case-access";
import { assertPhiProcessingAllowed } from "@/server/lib/phi-guard";
import { uploadDocument } from "@/server/pdf/upload";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export const documentRouter = createTRPCRouter({
  upload: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        filename: z.string().min(1).max(512),
        contentBase64: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "member");
      assertPhiProcessingAllowed();

      const buffer = Buffer.from(input.contentBase64, "base64");
      if (buffer.byteLength > MAX_PDF_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File exceeds 20MB limit",
        });
      }

      const sha256 = createHash("sha256").update(buffer).digest("hex");

      return uploadDocument({
        userId: ctx.user.id,
        caseId: input.caseId,
        filename: input.filename,
        buffer,
        sha256,
      });
    }),

  get: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        documentId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "viewer");

      const doc = await ctx.db.query.documents.findFirst({
        where: (documents, { and, eq }) =>
          and(
            eq(documents.id, input.documentId),
            eq(documents.caseId, input.caseId),
          ),
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: doc.id,
        filename: doc.filename,
        sha256: doc.sha256,
        pdfAiDocId: doc.pdfAiDocId,
        storageKey: doc.storageKey,
        storageBucket: doc.storageBucket,
        createdAt: doc.createdAt,
        hasExtractedText: Boolean(doc.extractedText),
      };
    }),
});
