import { createHmac } from "node:crypto";

import { env } from "@/env";
import { createHandoffToken } from "@/server/intake/handoff";
import { detectSensitiveIntent } from "@/server/intake/sensitivity";

function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  const sortedKeys = Object.keys(params).sort();
  const str = url + sortedKeys.map((k) => k + (params[k] ?? "")).join("");
  const expected = createHmac("sha1", authToken).update(str).digest("base64");
  return expected === signature;
}

function twiml(body: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body}</Message></Response>`,
    {
      headers: { "Content-Type": "text/xml" },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!env.TWILIO_AUTH_TOKEN) {
    return new Response("SMS intake not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody).entries());

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = request.url;

  if (!validateTwilioSignature(env.TWILIO_AUTH_TOKEN, url, params, signature)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = params.Body ?? "";
  const from = params.From ?? "";
  const numMedia = parseInt(params.NumMedia ?? "0", 10);

  const isSensitive = detectSensitiveIntent(body, numMedia > 0);

  if (!isSensitive) {
    return twiml(
      "Thanks for reaching out. Reply UPLOAD when you're ready to share documents securely.",
    );
  }

  try {
    const { raw, expiresAt } = await createHandoffToken({
      channel: "sms",
      intent: "upload",
      phoneE164: from,
    });

    const link = `${env.SITE_URL}/start?t=${raw}`;
    const expiryMin = Math.round(env.HANDOFF_TOKEN_TTL_MINUTES);

    return twiml(
      `For your privacy, upload securely (expires ${expiryMin} min): ${link}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Error: ${msg}`, { status: 500 });
  }
}
