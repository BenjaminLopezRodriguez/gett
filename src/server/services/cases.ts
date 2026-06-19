import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
  caseEvents,
  caseMembers,
  cases,
  type Case,
  type CaseMemberRole,
  type CaseStatus,
} from "@/server/db/schema";
import { appendCaseEvent } from "@/server/lib/audit";
import { generateCaseHash } from "@/server/lib/case-hash";
import { requireCaseMember } from "@/server/auth/case-access";

export class CaseAuthorizationError extends Error {
  constructor(message = "Not authorized for this case") {
    super(message);
    this.name = "CaseAuthorizationError";
  }
}

export function toTrpcError(error: unknown): never {
  if (error instanceof CaseAuthorizationError) {
    throw new TRPCError({ code: "NOT_FOUND", message: error.message });
  }
  if (error instanceof TRPCError) throw error;
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}

export async function createCase(
  userId: string,
  title: string,
  metadata?: Record<string, unknown>,
): Promise<Case> {
  const caseHash = generateCaseHash();

  const [created] = await db
    .insert(cases)
    .values({
      caseHash,
      title,
      createdBy: userId,
      metadata: metadata ?? {},
    })
    .returning();

  if (!created) throw new Error("Failed to create case");

  await db.insert(caseMembers).values({
    caseId: created.id,
    userId,
    role: "owner",
  });

  await logCaseEvent(created.id, userId, "case.created", { title, caseHash });

  return created;
}

export async function getCaseForUser(
  caseId: string,
  userId: string,
): Promise<Case> {
  try {
    await requireCaseMember(db, userId, caseId);
  } catch {
    throw new CaseAuthorizationError();
  }

  const row = await db.query.cases.findFirst({
    where: eq(cases.id, caseId),
  });

  if (!row) throw new CaseAuthorizationError();
  return row;
}

export async function listCasesForUser(userId: string) {
  const memberships = await db.query.caseMembers.findMany({
    where: eq(caseMembers.userId, userId),
    with: { case: true },
  });
  return memberships.map((m) => m.case);
}

export async function addCaseMember(
  actorId: string,
  caseId: string,
  targetUserId: string,
  role: CaseMemberRole,
) {
  await requireCaseMember(db, actorId, caseId, "owner");

  const [member] = await db
    .insert(caseMembers)
    .values({ caseId, userId: targetUserId, role })
    .onConflictDoNothing()
    .returning();

  await logCaseEvent(caseId, actorId, "case.member_added", {
    targetUserId,
    role,
  });

  return member;
}

export async function logCaseEvent(
  caseId: string,
  actorId: string | null,
  action: string,
  payload?: Record<string, unknown>,
) {
  return appendCaseEvent(db, { caseId, actorId, action, payload });
}

export async function getCaseEvents(caseId: string, userId: string) {
  await requireCaseMember(db, userId, caseId);
  const events = await db.query.caseEvents.findMany({
    where: eq(caseEvents.caseId, caseId),
    orderBy: (events, { desc }) => [desc(events.createdAt)],
  });
  return events.map((e) => ({
    id: e.id,
    eventType: e.action,
    payload: e.payload,
    createdAt: e.createdAt,
  }));
}

export async function updateCaseStatus(
  caseId: string,
  userId: string,
  status: CaseStatus,
) {
  await requireCaseMember(db, userId, caseId, "member");

  const [updated] = await db
    .update(cases)
    .set({ status, updatedAt: new Date() })
    .where(eq(cases.id, caseId))
    .returning();

  await logCaseEvent(caseId, userId, "case.status_updated", { status });
  return updated!;
}

/** @deprecated use getCaseEvents */
export const getCaseAuditLog = getCaseEvents;
