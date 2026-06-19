import { describe, it, expect, beforeEach, vi } from "vitest";

describe("assertPhiProcessingAllowed", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ALLOW_PHI_PROCESSING = "false";
    process.env.R2_ENDPOINT = "https://r2.example.com";
    process.env.NODE_ENV = "production";
  });

  it("throws when R2 is configured and PHI not allowed", async () => {
    const { assertPhiProcessingAllowed } = await import("@/server/lib/phi-guard");
    expect(() => assertPhiProcessingAllowed()).toThrow("PHI processing");
  });

  it("passes when ALLOW_PHI_PROCESSING is true", async () => {
    process.env.ALLOW_PHI_PROCESSING = "true";
    const { assertPhiProcessingAllowed } = await import("@/server/lib/phi-guard");
    expect(() => assertPhiProcessingAllowed()).not.toThrow();
  });

  it("passes when R2 is not configured (dev stub mode)", async () => {
    delete process.env.R2_ENDPOINT;
    process.env.ALLOW_PHI_PROCESSING = "false";
    const { assertPhiProcessingAllowed } = await import("@/server/lib/phi-guard");
    expect(() => assertPhiProcessingAllowed()).not.toThrow();
  });
});
