import { db } from "@/server/db";
import { waitlistEntries } from "@/server/db/schema";

const VALID_SEGMENTS = ["clinicians", "therapists"] as const;
type WaitlistSegment = (typeof VALID_SEGMENTS)[number];

function isValidSegment(s: unknown): s is WaitlistSegment {
  return VALID_SEGMENTS.includes(s as WaitlistSegment);
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return new Response("Invalid body", { status: 400 });
  }

  const { email, segment } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.includes("@") || email.length > 320) {
    return new Response("Invalid email", { status: 400 });
  }

  if (!isValidSegment(segment)) {
    return new Response("Invalid segment", { status: 400 });
  }

  await db
    .insert(waitlistEntries)
    .values({ email: email.trim().toLowerCase(), segment })
    .onConflictDoNothing();

  return new Response("OK", { status: 200 });
}
