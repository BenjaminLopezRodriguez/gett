import { env } from "@/env";

export class PdfAiClient {
  constructor(
    private apiKey: string,
    private baseUrl: string = env.PDF_AI_BASE_URL,
  ) {}

  async upload(
    file: Buffer,
    filename: string,
  ): Promise<{ docId: string; text: string }> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file)]), filename);

    const res = await fetch(`${this.baseUrl}/v1/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`pdf.ai upload failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { docId?: string; text?: string; id?: string };
    return {
      docId: data.docId ?? data.id ?? `placeholder_${Date.now()}`,
      text: data.text ?? "",
    };
  }

  async getDocument(docId: string): Promise<{ text: string }> {
    const res = await fetch(`${this.baseUrl}/v1/documents/${docId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`pdf.ai getDocument failed (${res.status})`);
    }

    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  }
}

export function getPdfAiClient(): PdfAiClient | null {
  if (!env.PDF_AI_API_KEY) return null;
  return new PdfAiClient(env.PDF_AI_API_KEY);
}

/** Stub when pdf.ai is not configured — keeps local dev unblocked. */
export async function extractPdfPlaceholder(
  buffer: Buffer,
  filename: string,
): Promise<{ docId: string; text: string }> {
  return {
    docId: `local_${Date.now()}`,
    text: `[pdf.ai placeholder] ${filename} (${buffer.byteLength} bytes). Configure PDF_AI_API_KEY for real extraction.`,
  };
}
