import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users, type User } from "@/server/db/schema";

export type KindeProfile = {
  id: string;
  email: string | null;
  given_name?: string | null;
  family_name?: string | null;
};

export async function getOrCreateUserFromKinde(
  profile: KindeProfile,
): Promise<User> {
  const existing = await db.query.users.findFirst({
    where: eq(users.kindeId, profile.id),
  });

  if (existing) return existing;

  const email = profile.email ?? `${profile.id}@unknown.local`;
  const name =
    [profile.given_name, profile.family_name].filter(Boolean).join(" ") ||
    profile.email ||
    "User";

  const [created] = await db
    .insert(users)
    .values({ kindeId: profile.id, email, name })
    .returning();

  if (!created) throw new Error("Failed to create user");
  return created;
}

export async function resolveCurrentUser(): Promise<User | null> {
  const { getKindeServerSession } = await import(
    "@kinde-oss/kinde-auth-nextjs/server"
  );
  const session = getKindeServerSession();
  const authed = await session.isAuthenticated();
  if (!authed) return null;

  const kindeUser = await session.getUser();
  if (!kindeUser?.id) return null;

  return getOrCreateUserFromKinde({
    id: kindeUser.id,
    email: kindeUser.email ?? null,
    given_name: kindeUser.given_name,
    family_name: kindeUser.family_name,
  });
}
