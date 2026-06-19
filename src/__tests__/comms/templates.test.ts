import { describe, it, expect } from "vitest";
import { TEMPLATES } from "@/lib/comms/templates";

describe("TEMPLATES", () => {
  it("secure_upload includes caseHash and url", () => {
    const body = TEMPLATES.secure_upload("GETT-ABCD", "https://gett.md/start?t=xyz");
    expect(body).toContain("GETT-ABCD");
    expect(body).toContain("https://gett.md/start?t=xyz");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("reminder includes caseHash and url", () => {
    const body = TEMPLATES.reminder("GETT-ABCD", "https://gett.md/start?t=xyz");
    expect(body).toContain("GETT-ABCD");
    expect(body).toContain("https://gett.md/start?t=xyz");
    expect(body.length).toBeLessThanOrEqual(160);
  });
});
