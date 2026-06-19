import { describe, it, expect } from "vitest";
import { detectSensitiveIntent } from "@/server/intake/sensitivity";

describe("detectSensitiveIntent", () => {
  it("returns false for benign message", () => {
    expect(detectSensitiveIntent("Hello, I need help", false)).toBe(false);
  });

  it("returns true for MMS (hasMedia=true)", () => {
    expect(detectSensitiveIntent("hi", true)).toBe(true);
  });

  it("returns true for message containing 'doctor'", () => {
    expect(detectSensitiveIntent("I saw my doctor yesterday", false)).toBe(true);
  });

  it("returns true for message containing 'diagnosis'", () => {
    expect(detectSensitiveIntent("The diagnosis was...", false)).toBe(true);
  });

  it("returns true for message containing 'MRI'", () => {
    expect(detectSensitiveIntent("I need to send my MRI results", false)).toBe(true);
  });

  it("returns true for message containing 'SSN'", () => {
    expect(detectSensitiveIntent("My SSN is 123-45-6789", false)).toBe(true);
  });

  it("returns true for message containing 'claim'", () => {
    expect(detectSensitiveIntent("My claim number is 12345", false)).toBe(true);
  });

  it("returns true for message containing 'upload'", () => {
    expect(detectSensitiveIntent("I want to upload a file", false)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectSensitiveIntent("DOCTOR visit today", false)).toBe(true);
  });

  it("returns true for 'start my case'", () => {
    expect(detectSensitiveIntent("I want to start my case", false)).toBe(true);
  });
});
