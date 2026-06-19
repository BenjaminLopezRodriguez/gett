import { randomUUID } from "node:crypto";

import { requireCaseMember } from "@/server/auth/case-access";
import { db } from "@/server/db";
import { documents } from "@/server/db/schema";
import { logCaseEvent } from "@/server/services/cases";
import { extractPdfPlaceholder, getPdfAiClient } from "@/server/pdf/client";
import {
  buildDocumentStorageKey,
  buildPlaceholderStorageKey,
  isR2Configured,
  R2_BUCKETS,
  uploadToBucket,
} from "@/server/storage/r2";

export async function uploadDocument(input: {
  userId: string;
  caseId: string;
  filename: string;
  buffer: Buffer;
  sha256: string;
}) {
  await requireCaseMember(db, input.userId, input.caseId, "member");

  const documentId = randomUUID();
  const storageBucket = R2_BUCKETS.CASES;

  const client = getPdfAiClient();
  const extracted = client
    ? await client.upload(input.buffer, input.filename)
    : await extractPdfPlaceholder(input.buffer, input.filename);

  let storageKey = buildPlaceholderStorageKey(
    input.caseId,
    documentId,
    input.filename,
  );

  if (isR2Configured()) {
    storageKey = buildDocumentStorageKey(
      input.caseId,
      documentId,
      input.filename,
    );
    await uploadToBucket(
      storageBucket,
      storageKey,
      input.buffer,
      "application/pdf",
    );
  }

  const [doc] = await db
    .insert(documents)
    .values({
      id: documentId,
      caseId: input.caseId,
      filename: input.filename,
      sha256: input.sha256,
      storageKey,
      storageBucket,
      pdfAiDocId: extracted.docId,
      extractedText: extracted.text,
      uploadedBy: input.userId,
    })
    .returning();

  await logCaseEvent(input.caseId, input.userId, "document.uploaded", {
    documentId: doc!.id,
    filename: input.filename,
    sha256: input.sha256,
    pdfAiDocId: extracted.docId,
  });

  return {
    id: doc!.id,
    filename: doc!.filename,
    sha256: doc!.sha256,
    pdfAiDocId: doc!.pdfAiDocId,
    storageKey: doc!.storageKey,
    storageBucket: doc!.storageBucket,
  };
}
