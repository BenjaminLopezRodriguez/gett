import { describe, it, expect } from "vitest";
import { generateToken } from "@/server/intake/handoff";
import { createHash } from "node:crypto";

describe("generateToken", () => {
  it("returns a raw token of 64 hex chars (32 bytes)", () => {
    const { raw } = generateToken();
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns hash equal to sha256 of raw", () => {
    const { raw, hash } = generateToken();
    const expected = createHash("sha256").update(raw).digest("hex");
    expect(hash).toBe(expected);
  });

  it("generates unique tokens each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
  });
});
