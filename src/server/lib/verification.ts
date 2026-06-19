import "server-only";

import type { VerificationStatus } from "@/server/db/schema";

export function isVerified(status: VerificationStatus): boolean {
  return status === "verified";
}

export function needsVerificationPrompt(status: VerificationStatus): boolean {
  return status === "unverified" || status === "skipped";
}

/** Gate sensitive actions that require a verified account. */
export function requireVerified(status: VerificationStatus): void {
  if (!isVerified(status)) {
    throw new Error("This action requires a verified account.");
  }
}
