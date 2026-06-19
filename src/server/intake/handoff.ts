import { createHash, randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  intakeHandoffTokens,
  type IntakeHandoffToken,
} from "@/server/db/schema";

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function createHandoffToken(input: {
  channel: "sms" | "web" | "voice";
  intent?: "upload" | "intake" | "general";
  phoneE164?: string;
  caseId?: string;
  intentMeta?: Record<string, string>;
}): Promise<{ raw: string; expiresAt: Date }> {
  const { raw, hash } = generateToken();
  const ttlMs = env.HANDOFF_TOKEN_TTL_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.insert(intakeHandoffTokens).values({
    tokenHash: hash,
    channel: input.channel,
    intent: input.intent ?? "upload",
    phoneE164: input.phoneE164,
    caseId: input.caseId,
    intentMeta: input.intentMeta ?? {},
    expiresAt,
  });

  return { raw, expiresAt };
}

export async function validateHandoffToken(
  raw: string,
): Promise<IntakeHandoffToken | null> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const token = await db.query.intakeHandoffTokens.findFirst({
    where: eq(intakeHandoffTokens.tokenHash, hash),
  });
  if (!token) return null;
  if (token.consumedAt) return null;
  if (token.expiresAt < new Date()) return null;
  return token;
}

export async function consumeHandoffToken(
  raw: string,
  userId: string,
): Promise<void> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const token = await db.query.intakeHandoffTokens.findFirst({
    where: eq(intakeHandoffTokens.tokenHash, hash),
  });
  if (!token) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Token not found" });
  }
  if (token.consumedAt) {
    if (token.userId === userId) return; // idempotent same user
    throw new TRPCError({ code: "FORBIDDEN", message: "Token already used" });
  }
  await db
    .update(intakeHandoffTokens)
    .set({ consumedAt: new Date(), userId })
    .where(eq(intakeHandoffTokens.tokenHash, hash));
}
