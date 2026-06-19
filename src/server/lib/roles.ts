import type { CaseMemberRole } from "@/server/db/schema";

const ROLE_RANK: Record<CaseMemberRole, number> = {
  viewer: 1,
  lawyer: 2,
  member: 3,
  owner: 4,
};

export function roleMeetsMinimum(
  role: CaseMemberRole,
  minimum: CaseMemberRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
