import { TRPCError } from "@trpc/server";

import { env } from "@/env";

/** Coerces a flag value that may be a boolean (after zod transform) or a raw string (when SKIP_ENV_VALIDATION=true). */
function isEnabled(value: boolean | string | undefined): boolean {
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
}

export function assertPhiProcessingAllowed(): void {
  const hasRealStorage = !!env.R2_ENDPOINT;
  if (hasRealStorage && !isEnabled(env.ALLOW_PHI_PROCESSING as boolean | string | undefined)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "PHI processing is not enabled. Set ALLOW_PHI_PROCESSING=true after BAAs are signed.",
    });
  }
}

export function assertAiProcessingAllowed(): void {
  if (!isEnabled(env.ALLOW_AI_PROCESSING as boolean | string | undefined)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "AI processing is not enabled. Set ALLOW_AI_PROCESSING=true after data agreements are in place.",
    });
  }
}
