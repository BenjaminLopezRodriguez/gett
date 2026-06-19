import { describe, it, expect } from "vitest";
import { buildSmsUrl, buildTelUrl } from "@/lib/comms/sms-url";

describe("buildSmsUrl", () => {
  it("returns sms: URL with encoded body", () => {
    const url = buildSmsUrl("+15551234567", "Hello world");
    expect(url).toBe("sms:+15551234567?body=Hello%20world");
  });

  it("encodes special characters in body", () => {
    const url = buildSmsUrl("+15551234567", "Link: https://gett.md/start?t=abc");
    expect(url).toContain("sms:+15551234567?body=");
    expect(url).toContain("https%3A%2F%2Fgett.md");
  });
});

describe("buildTelUrl", () => {
  it("returns tel: URL", () => {
    expect(buildTelUrl("+15551234567")).toBe("tel:+15551234567");
  });
});
