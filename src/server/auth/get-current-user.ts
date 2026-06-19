import "server-only";

import { resolveCurrentUser } from "@/server/auth/session";
import type { User } from "@/server/db/schema";

export async function getCurrentUser(): Promise<User | null> {
  return resolveCurrentUser();
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
