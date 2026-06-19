import "server-only";

import { env } from "@/env";

export type PdfAiCitation = {
  page: number;
  text: string;
  bbox?: { x: number; y: number; width: number; height: number };
};

export type PdfAiExtractionResult = {
  documentId: string;
  text: string;
  citations: PdfAiCitation[];
  metadata: {
    pageCount: number;
    filename: string;
  };
};

export type PdfAiUploadResult = {
  documentId: string;
  status: "processing" | "ready";
};

const isConfigured = () => Boolean(env.PDF_AI_API_KEY);

async function pdfAiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!env.PDF_AI_API_KEY) {
    throw new Error("PDF_AI_API_KEY is not configured");
  }

  const baseUrl = env.PDF_AI_BASE_URL ?? "https://api.pdf.ai/v1";
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PDF_AI_API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`pdf.ai request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export async function uploadPdfToPdfAi(
  filename: string,
  fileBytes: Buffer,
): Promise<PdfAiUploadResult> {
  if (!isConfigured()) {
    return {
      documentId: `stub-${Date.now()}`,
      status: "ready",
    };
  }

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(fileBytes)], { type: "application/pdf" }),
    filename,
  );

  return pdfAiFetch<PdfAiUploadResult>("/documents", {
    method: "POST",
    body: formData,
  });
}

export async function extractTextFromPdfAi(
  documentId: string,
  filename: string,
): Promise<PdfAiExtractionResult> {
  if (!isConfigured()) {
    return {
      documentId,
      text: `[pdf.ai stub] Extracted text placeholder for ${filename}. Configure PDF_AI_API_KEY for live extraction.`,
      citations: [
        {
          page: 1,
          text: "Placeholder citation — page 1, paragraph 1.",
        },
      ],
      metadata: {
        pageCount: 1,
        filename,
      },
    };
  }

  const result = await pdfAiFetch<{
    text: string;
    citations?: PdfAiCitation[];
    page_count?: number;
  }>(`/documents/${documentId}/extract`, { method: "POST" });

  return {
    documentId,
    text: result.text,
    citations: result.citations ?? [],
    metadata: {
      pageCount: result.page_count ?? 1,
      filename,
    },
  };
}

export async function examineDocumentWithPdfAi(
  documentId: string,
  filename: string,
  question: string,
): Promise<PdfAiExtractionResult & { answer: string }> {
  const extraction = await extractTextFromPdfAi(documentId, filename);

  return {
    ...extraction,
    answer: `[pdf.ai stub] Answer to "${question}" based on ${filename}. Citations: ${extraction.citations.length}.`,
  };
}
