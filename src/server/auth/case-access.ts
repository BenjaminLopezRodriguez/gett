import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import type { db as Db } from "@/server/db";
import {
  caseMembers,
  type CaseMember,
  type CaseMemberRole,
} from "@/server/db/schema";
import { roleMeetsMinimum } from "@/server/lib/roles";

type Database = typeof Db;

export async function requireCaseMember(
  database: Database,
  userId: string,
  caseId: string,
  minimumRole: CaseMemberRole = "viewer",
): Promise<CaseMember> {
  const membership = await database.query.caseMembers.findFirst({
    where: and(
      eq(caseMembers.caseId, caseId),
      eq(caseMembers.userId, userId),
    ),
  });

  if (!membership || !roleMeetsMinimum(membership.role, minimumRole)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
  }

  return membership;
}

export async function getAuthorizedCaseIds(
  database: Database,
  userId: string,
): Promise<string[]> {
  const rows = await database.query.caseMembers.findMany({
    where: eq(caseMembers.userId, userId),
    columns: { caseId: true },
  });
  return rows.map((r) => r.caseId);
}
