# Secure Intake, Upload & Case Comms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build handoff token flow, `/start` upload page, Twilio webhook scaffold, and Case Comms tab onto the existing gett Next.js/tRPC/Drizzle stack.

**Architecture:** A single-use, short-lived token (sha256-hashed in DB) gates document upload behind Kinde auth. A pre-auth `/start?t=<token>` page shows VerifyGate or UploadScanner depending on session state. Case Comms tab on the case detail page lets lawyers generate templated `sms:` links containing fresh tokens.

**Tech Stack:** Next.js 15 App Router, tRPC 11, Drizzle ORM + Neon Postgres, Kinde auth, Cloudflare R2, Vitest for unit tests.

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `vitest.config.ts` | Vitest config with tsconfig paths |
| `src/server/intake/handoff.ts` | Token generate / create / validate / consume |
| `src/server/intake/sensitivity.ts` | Keyword-based sensitive intent detection |
| `src/server/lib/phi-guard.ts` | PHI/AI processing guards |
| `src/lib/comms/templates.ts` | SMS body templates |
| `src/lib/comms/sms-url.ts` | `sms:` / `tel:` URL builders |
| `src/server/api/routers/intake.ts` | createHandoffLink / resolveHandoff / consumeHandoff |
| `src/server/api/routers/comms.ts` | getCaseContacts / upsertCaseContact / buildMessageTemplate / logOutboundComms |
| `src/app/start/page.tsx` | Server component: token validation + session check |
| `src/app/start/_components/verify-gate.tsx` | Pre-auth screen |
| `src/app/start/_components/upload-scanner.tsx` | Client: capture / resize / upload / success |
| `src/app/cases/[caseId]/_components/case-comms-panel.tsx` | Comms tab UI |
| `src/app/api/intake/sms/route.ts` | Twilio inbound webhook scaffold |
| `src/__tests__/intake/sensitivity.test.ts` | Unit tests |
| `src/__tests__/intake/phi-guard.test.ts` | Unit tests |
| `src/__tests__/comms/templates.test.ts` | Unit tests |
| `src/__tests__/comms/sms-url.test.ts` | Unit tests |
| `src/__tests__/intake/handoff-token.test.ts` | Unit tests for generateToken |

### Modified files
| Path | What changes |
|---|---|
| `src/server/db/schema.ts` | Add 5 enums + 3 tables + relations |
| `src/server/api/root.ts` | Mount `intake` + `comms` routers |
| `src/env.js` | Add 7 new env vars |
| `src/middleware.ts` | Add `/start` to publicPaths |
| `src/server/api/routers/document.ts` | Add phi-guard to upload mutation |
| `src/app/cases/[caseId]/_components/case-detail-client.tsx` | Refactor to 3-tab layout |
| `package.json` | Add vitest + vite-tsconfig-paths, add `test` script |
| `.env.example` | Document new vars |

---

## Task 1: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest and vite-tsconfig-paths**

```bash
pnpm add -D vitest vite-tsconfig-paths
```

Expected: both packages appear in `package.json` devDependencies.

- [ ] **Step 2: Create vitest config**

```ts
// vitest.config.ts
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    env: {
      SKIP_ENV_VALIDATION: "true",
      DATABASE_URL: "postgresql://test:test@localhost/test",
      NODE_ENV: "test",
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, inside `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a canary test to verify setup**

Create `src/__tests__/canary.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

Expected output: `1 passed`.

- [ ] **Step 6: Delete canary, commit**

```bash
rm src/__tests__/canary.test.ts
git add vitest.config.ts package.json
git commit -m "chore: add vitest"
```

---

## Task 2: Sensitivity detector (TDD)

**Files:**
- Create: `src/server/intake/sensitivity.ts`
- Create: `src/__tests__/intake/sensitivity.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/__tests__/intake/sensitivity.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/__tests__/intake/sensitivity.test.ts
```

Expected: FAIL — "Cannot find module '@/server/intake/sensitivity'".

- [ ] **Step 3: Implement sensitivity detector**

```ts
// src/server/intake/sensitivity.ts
const SENSITIVE_KEYWORDS = [
  "doctor",
  "diagnosis",
  "employer",
  "injury",
  "ssn",
  "dob",
  "upload",
  "document",
  "mri",
  "claim",
  "start my case",
  "talk to a lawyer",
] as const;

export function detectSensitiveIntent(text: string, hasMedia: boolean): boolean {
  if (hasMedia) return true;
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}
```

- [ ] **Step 4: Run tests — all pass**

```bash
pnpm test src/__tests__/intake/sensitivity.test.ts
```

Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add src/server/intake/sensitivity.ts src/__tests__/intake/sensitivity.test.ts
git commit -m "feat: add sensitive intent detector"
```

---

## Task 3: SMS URL helpers + templates (TDD)

**Files:**
- Create: `src/lib/comms/sms-url.ts`
- Create: `src/lib/comms/templates.ts`
- Create: `src/__tests__/comms/sms-url.test.ts`
- Create: `src/__tests__/comms/templates.test.ts`

- [ ] **Step 1: Write failing tests for sms-url**

```ts
// src/__tests__/comms/sms-url.test.ts
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
```

- [ ] **Step 2: Write failing tests for templates**

```ts
// src/__tests__/comms/templates.test.ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm test src/__tests__/comms/
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement sms-url.ts**

```ts
// src/lib/comms/sms-url.ts
export function buildSmsUrl(phoneE164: string, body: string): string {
  return `sms:${phoneE164}?body=${encodeURIComponent(body)}`;
}

export function buildTelUrl(phoneE164: string): string {
  return `tel:${phoneE164}`;
}
```

- [ ] **Step 5: Implement templates.ts**

```ts
// src/lib/comms/templates.ts
export const TEMPLATES = {
  secure_upload: (caseHash: string, url: string) =>
    `Upload securely for case ${caseHash}: ${url}`,
  reminder: (caseHash: string, url: string) =>
    `Reminder — secure upload link for case ${caseHash}: ${url}`,
} as const;

export type TemplateId = keyof typeof TEMPLATES;
```

- [ ] **Step 6: Run tests — all pass**

```bash
pnpm test src/__tests__/comms/
```

Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add src/lib/comms/sms-url.ts src/lib/comms/templates.ts \
  src/__tests__/comms/sms-url.test.ts src/__tests__/comms/templates.test.ts
git commit -m "feat: add comms URL helpers and SMS templates"
```

---

## Task 4: Environment variables

**Files:**
- Modify: `src/env.js`
- Modify: `.env.example`

- [ ] **Step 1: Add new vars to src/env.js**

In the `server:` object, add after the Slack section:

```js
// Intake / Handoff
TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
HANDOFF_TOKEN_TTL_MINUTES: z.coerce.number().default(20),
SITE_URL: z.string().url().default("https://gett.md"),

// Feature flags
ALLOW_PHI_PROCESSING: z.coerce.boolean().default(false),
ALLOW_AI_PROCESSING: z.coerce.boolean().default(false),
```

In the `runtimeEnv:` object, add:

```js
TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
HANDOFF_TOKEN_TTL_MINUTES: process.env.HANDOFF_TOKEN_TTL_MINUTES,
SITE_URL: process.env.SITE_URL,
ALLOW_PHI_PROCESSING: process.env.ALLOW_PHI_PROCESSING,
ALLOW_AI_PROCESSING: process.env.ALLOW_AI_PROCESSING,
```

- [ ] **Step 2: Update .env.example**

Add to `.env.example`:

```bash
# Intake / SMS (P2+)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
HANDOFF_TOKEN_TTL_MINUTES="20"
SITE_URL="https://gett.md"

# Feature flags (set to "true" after BAAs signed)
ALLOW_PHI_PROCESSING="false"
ALLOW_AI_PROCESSING="false"
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm check
```

Expected: no type errors related to env.

- [ ] **Step 4: Commit**

```bash
git add src/env.js .env.example
git commit -m "feat: add intake and feature-flag env vars"
```

---

## Task 5: PHI guard (TDD)

**Files:**
- Create: `src/server/lib/phi-guard.ts`
- Create: `src/__tests__/intake/phi-guard.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/__tests__/intake/phi-guard.test.ts
import { describe, it, expect, beforeEach } from "vitest";

describe("assertPhiProcessingAllowed", () => {
  beforeEach(() => {
    // Vitest env has SKIP_ENV_VALIDATION=true, so we set flags directly
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
```

> Note: These tests use dynamic `import()` so they pick up process.env changes. If you see caching issues, run with `--no-cache`.

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test src/__tests__/intake/phi-guard.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement phi-guard.ts**

```ts
// src/server/lib/phi-guard.ts
import { TRPCError } from "@trpc/server";

import { env } from "@/env";

export function assertPhiProcessingAllowed(): void {
  const hasRealStorage = !!env.R2_ENDPOINT;
  if (hasRealStorage && !env.ALLOW_PHI_PROCESSING) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "PHI processing is not enabled. Set ALLOW_PHI_PROCESSING=true after BAAs are signed.",
    });
  }
}

export function assertAiProcessingAllowed(): void {
  if (!env.ALLOW_AI_PROCESSING) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "AI processing is not enabled. Set ALLOW_AI_PROCESSING=true after data agreements are in place.",
    });
  }
}
```

- [ ] **Step 4: Run tests — pass**

```bash
pnpm test src/__tests__/intake/phi-guard.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/server/lib/phi-guard.ts src/__tests__/intake/phi-guard.test.ts
git commit -m "feat: add PHI and AI processing guards"
```

---

## Task 6: Schema additions

**Files:**
- Modify: `src/server/db/schema.ts`

- [ ] **Step 1: Add new enums at the top of schema.ts (after existing enums)**

```ts
export const handoffChannelEnum = pgEnum("handoff_channel", [
  "sms",
  "web",
  "voice",
]);

export const handoffIntentEnum = pgEnum("handoff_intent", [
  "upload",
  "intake",
  "general",
]);

export const caseContactRoleEnum = pgEnum("case_contact_role", [
  "client",
  "lawyer",
  "adjuster",
]);

export const messageDirectionEnum = pgEnum("message_direction", ["in", "out"]);

export const messageChannelEnum = pgEnum("message_channel", ["sms", "call"]);
```

- [ ] **Step 2: Add the three new tables (after the existing `documents` table)**

```ts
export const intakeHandoffTokens = createTable(
  "intake_handoff_token",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    tokenHash: d.varchar({ length: 64 }).notNull(),
    channel: handoffChannelEnum().notNull(),
    phoneE164: d.varchar({ length: 20 }),
    intent: handoffIntentEnum().notNull().default("upload"),
    intentMeta: d.jsonb().$type<Record<string, string>>().default({}),
    caseId: d.uuid().references(() => cases.id, { onDelete: "set null" }),
    userId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
    consumedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("handoff_token_hash_idx").on(t.tokenHash),
    index("handoff_token_expires_idx").on(t.expiresAt),
  ],
);

export const caseContacts = createTable(
  "case_contact",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    role: caseContactRoleEnum().notNull(),
    phoneE164: d.varchar({ length: 20 }).notNull(),
    displayName: d.varchar({ length: 256 }).notNull(),
    smsConsentAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("case_contact_unique_idx").on(t.caseId, t.phoneE164, t.role),
    index("case_contact_case_idx").on(t.caseId),
  ],
);

export const caseMessages = createTable(
  "case_message",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum().notNull(),
    templateId: d.varchar({ length: 128 }).notNull(),
    channel: messageChannelEnum().notNull(),
    actorId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("case_message_case_idx").on(t.caseId)],
);
```

- [ ] **Step 3: Add exported types at the bottom of schema.ts**

```ts
export type IntakeHandoffToken = typeof intakeHandoffTokens.$inferSelect;
export type CaseContact = typeof caseContacts.$inferSelect;
export type CaseMessage = typeof caseMessages.$inferSelect;
```

- [ ] **Step 4: Add relations (after the existing `documentsRelations`)**

```ts
export const intakeHandoffTokensRelations = relations(
  intakeHandoffTokens,
  ({ one }) => ({
    case: one(cases, {
      fields: [intakeHandoffTokens.caseId],
      references: [cases.id],
    }),
    user: one(users, {
      fields: [intakeHandoffTokens.userId],
      references: [users.id],
    }),
  }),
);

export const caseContactsRelations = relations(caseContacts, ({ one }) => ({
  case: one(cases, { fields: [caseContacts.caseId], references: [cases.id] }),
}));

export const caseMessagesRelations = relations(caseMessages, ({ one }) => ({
  case: one(cases, { fields: [caseMessages.caseId], references: [cases.id] }),
  actor: one(users, {
    fields: [caseMessages.actorId],
    references: [users.id],
  }),
}));
```

Also add `contacts` and `messages` to the existing `casesRelations`:

```ts
export const casesRelations = relations(cases, ({ one, many }) => ({
  creator: one(users, { fields: [cases.createdBy], references: [users.id] }),
  members: many(caseMembers),
  events: many(caseEvents),
  documents: many(documents),
  contacts: many(caseContacts),       // add this
  messages: many(caseMessages),       // add this
}));
```

- [ ] **Step 5: Verify TypeScript**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/server/db/schema.ts
git commit -m "feat: add handoff token, case contacts, and case messages schema"
```

---

## Task 7: Generate and run migration

**Files:**
- New migration file auto-generated in `drizzle/`

- [ ] **Step 1: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: a new `.sql` file appears in `drizzle/` containing `CREATE TABLE "gett_intake_handoff_token"`, `CREATE TABLE "gett_case_contact"`, `CREATE TABLE "gett_case_message"`, and the new enum types.

- [ ] **Step 2: Review the generated SQL**

Open the generated file and verify:
- All three tables are created with correct columns
- The 5 new enums are created
- Unique indexes are present: `handoff_token_hash_idx`, `case_contact_unique_idx`

- [ ] **Step 3: Apply migration**

```bash
pnpm drizzle-kit migrate
```

Expected: "migrations applied successfully" (no errors).

- [ ] **Step 4: Commit**

```bash
git add drizzle/
git commit -m "feat: apply intake handoff and case comms migration"
```

---

## Task 8: Handoff token service

**Files:**
- Create: `src/server/intake/handoff.ts`
- Create: `src/__tests__/intake/handoff-token.test.ts`

- [ ] **Step 1: Write failing unit tests for generateToken (pure function only)**

```ts
// src/__tests__/intake/handoff-token.test.ts
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
```

- [ ] **Step 2: Run — fail**

```bash
pnpm test src/__tests__/intake/handoff-token.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement handoff.ts**

```ts
// src/server/intake/handoff.ts
import { createHash, randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  intakeHandoffTokens,
  type IntakeHandoffToken,
} from "@/server/db/schema";

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function createHandoffToken(input: {
  channel: "sms" | "web" | "voice";
  intent?: "upload" | "intake" | "general";
  phoneE164?: string;
  caseId?: string;
  intentMeta?: Record<string, string>;
}): Promise<{ raw: string; expiresAt: Date }> {
  const { raw, hash } = generateToken();
  const ttlMs = env.HANDOFF_TOKEN_TTL_MINUTES * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.insert(intakeHandoffTokens).values({
    tokenHash: hash,
    channel: input.channel,
    intent: input.intent ?? "upload",
    phoneE164: input.phoneE164,
    caseId: input.caseId,
    intentMeta: input.intentMeta ?? {},
    expiresAt,
  });

  return { raw, expiresAt };
}

export async function validateHandoffToken(
  raw: string,
): Promise<IntakeHandoffToken | null> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const token = await db.query.intakeHandoffTokens.findFirst({
    where: eq(intakeHandoffTokens.tokenHash, hash),
  });
  if (!token) return null;
  if (token.consumedAt) return null;
  if (token.expiresAt < new Date()) return null;
  return token;
}

export async function consumeHandoffToken(
  raw: string,
  userId: string,
): Promise<void> {
  const hash = createHash("sha256").update(raw).digest("hex");
  const token = await db.query.intakeHandoffTokens.findFirst({
    where: eq(intakeHandoffTokens.tokenHash, hash),
  });
  if (!token) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Token not found" });
  }
  if (token.consumedAt) {
    if (token.userId === userId) return; // idempotent same user
    throw new TRPCError({ code: "FORBIDDEN", message: "Token already used" });
  }
  await db
    .update(intakeHandoffTokens)
    .set({ consumedAt: new Date(), userId })
    .where(eq(intakeHandoffTokens.tokenHash, hash));
}
```

- [ ] **Step 4: Run unit tests — pass**

```bash
pnpm test src/__tests__/intake/handoff-token.test.ts
```

Expected: 3 passed (generateToken tests only; DB-dependent functions are covered by acceptance tests).

- [ ] **Step 5: Commit**

```bash
git add src/server/intake/handoff.ts src/__tests__/intake/handoff-token.test.ts
git commit -m "feat: add handoff token service"
```

---

## Task 9: Intake tRPC router

**Files:**
- Create: `src/server/api/routers/intake.ts`

- [ ] **Step 1: Create the router**

The full `src/server/api/routers/intake.ts`:

```ts
// src/server/api/routers/intake.ts
import { z } from "zod";

import { env } from "@/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { requireCaseMember } from "@/server/auth/case-access";
import {
  consumeHandoffToken,
  createHandoffToken,
  validateHandoffToken,
} from "@/server/intake/handoff";
import { logCaseEvent } from "@/server/services/cases";

export const intakeRouter = createTRPCRouter({
  createHandoffLink: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid().optional(),
        intent: z.enum(["upload", "intake"]).default("upload"),
        phoneE164: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.caseId) {
        await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "member");
      }
      const { raw, expiresAt } = await createHandoffToken({
        channel: "web",
        intent: input.intent,
        phoneE164: input.phoneE164,
        caseId: input.caseId,
      });
      return { url: `${env.SITE_URL}/start?t=${raw}`, expiresAt };
    }),

  resolveHandoff: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const token = await validateHandoffToken(input.token);
      if (!token) {
        return { valid: false, expired: true, intent: null, minutesRemaining: 0 };
      }
      const minutesRemaining = Math.max(
        0,
        Math.floor((token.expiresAt.getTime() - Date.now()) / 60_000),
      );
      return {
        valid: true,
        expired: false,
        intent: token.intent,
        caseId: token.caseId ?? undefined,
        minutesRemaining,
      };
    }),

  consumeHandoff: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        caseId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await consumeHandoffToken(input.token, ctx.user.id);
      await logCaseEvent(input.caseId, ctx.user.id, "handoff.consumed", {
        intent: "upload",
      });
    }),
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/api/routers/intake.ts
git commit -m "feat: add intake tRPC router"
```

---

## Task 10: Comms tRPC router

**Files:**
- Create: `src/server/api/routers/comms.ts`

- [ ] **Step 1: Create the router**

```ts
// src/server/api/routers/comms.ts
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { caseProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  caseContactRoleEnum,
  caseContacts,
  caseMessages,
  cases,
} from "@/server/db/schema";
import { buildSmsUrl } from "@/lib/comms/sms-url";
import { TEMPLATES, type TemplateId } from "@/lib/comms/templates";
import { createHandoffToken } from "@/server/intake/handoff";
import { logCaseEvent } from "@/server/services/cases";

export const commsRouter = createTRPCRouter({
  getCaseContacts: caseProcedure("viewer").query(async ({ ctx }) => {
    return ctx.db.query.caseContacts.findMany({
      where: eq(caseContacts.caseId, ctx.caseId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }),

  upsertCaseContact: caseProcedure("member")
    .input(
      z.object({
        role: z.enum(caseContactRoleEnum.enumValues),
        phoneE164: z.string().min(7).max(20),
        displayName: z.string().min(1).max(256),
        smsConsentAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [contact] = await ctx.db
        .insert(caseContacts)
        .values({
          caseId: ctx.caseId,
          role: input.role,
          phoneE164: input.phoneE164,
          displayName: input.displayName,
          smsConsentAt: input.smsConsentAt,
        })
        .onConflictDoUpdate({
          target: [caseContacts.caseId, caseContacts.phoneE164, caseContacts.role],
          set: {
            displayName: input.displayName,
            smsConsentAt: input.smsConsentAt,
          },
        })
        .returning();
      return contact!;
    }),

  buildMessageTemplate: caseProcedure("member")
    .input(
      z.object({
        templateId: z.enum(["secure_upload", "reminder"] as const),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientContact = await ctx.db.query.caseContacts.findFirst({
        where: (t, { and, eq: eqFn }) =>
          and(eqFn(t.caseId, ctx.caseId), eqFn(t.role, "client")),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      if (!clientContact) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No client contact found for this case. Add one first.",
        });
      }

      const caseRow = await ctx.db.query.cases.findFirst({
        where: eq(cases.id, ctx.caseId),
      });
      if (!caseRow) throw new TRPCError({ code: "NOT_FOUND" });

      const { raw, expiresAt } = await createHandoffToken({
        channel: "sms",
        intent: "upload",
        caseId: ctx.caseId,
      });

      const handoffUrl = `${env.SITE_URL}/start?t=${raw}`;
      const previewBody = TEMPLATES[input.templateId as TemplateId](
        caseRow.caseHash,
        handoffUrl,
      );
      const smsUrl = buildSmsUrl(clientContact.phoneE164, previewBody);

      await logCaseEvent(ctx.caseId, ctx.user.id, "comms.template_prepared", {
        templateId: input.templateId,
      });

      return { previewBody, smsUrl, handoffUrl, expiresAt };
    }),

  logOutboundComms: caseProcedure("member")
    .input(
      z.object({
        templateId: z.string().min(1),
        channel: z.enum(["sms", "call"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(caseMessages).values({
        caseId: ctx.caseId,
        direction: "out",
        templateId: input.templateId,
        channel: input.channel,
        actorId: ctx.user.id,
      });
      await logCaseEvent(ctx.caseId, ctx.user.id, "comms.sent", {
        templateId: input.templateId,
        channel: input.channel,
      });
    }),

  getCaseMessages: caseProcedure("viewer").query(async ({ ctx }) => {
    return ctx.db.query.caseMessages.findMany({
      where: eq(caseMessages.caseId, ctx.caseId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }),
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/api/routers/comms.ts
git commit -m "feat: add comms tRPC router"
```

---

## Task 11: Mount routers + middleware + phi-guard

**Files:**
- Modify: `src/server/api/root.ts`
- Modify: `src/middleware.ts`
- Modify: `src/server/api/routers/document.ts`

- [ ] **Step 1: Mount intake and comms routers in root.ts**

Replace the contents of `src/server/api/root.ts` with:

```ts
import { agentRouter } from "@/server/api/routers/agent";
import { caseRouter } from "@/server/api/routers/case";
import { commsRouter } from "@/server/api/routers/comms";
import { documentRouter } from "@/server/api/routers/document";
import { intakeRouter } from "@/server/api/routers/intake";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  case: caseRouter,
  document: documentRouter,
  agent: agentRouter,
  user: userRouter,
  intake: intakeRouter,
  comms: commsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
```

- [ ] **Step 2: Add /start to middleware public paths**

Replace `src/middleware.ts` with:

```ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function middleware() {},
  {
    isReturnToCurrentPage: true,
    publicPaths: ["/", "/api/auth", "/start"],
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/onboarding",
    "/api/agents/:path*",
  ],
};
```

- [ ] **Step 3: Add phi-guard to document upload**

In `src/server/api/routers/document.ts`, add this import at the top:

```ts
import { assertPhiProcessingAllowed } from "@/server/lib/phi-guard";
```

Then in the `upload` mutation, add the guard call immediately after `requireCaseMember`:

```ts
await requireCaseMember(ctx.db, ctx.user.id, input.caseId, "member");
assertPhiProcessingAllowed(); // add this line
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/root.ts src/middleware.ts src/server/api/routers/document.ts
git commit -m "feat: mount intake/comms routers, guard upload, add /start to public paths"
```

---

## Task 12: `/start` page — server component + VerifyGate

**Files:**
- Create: `src/app/start/page.tsx`
- Create: `src/app/start/_components/verify-gate.tsx`

- [ ] **Step 1: Create VerifyGate component**

```tsx
// src/app/start/_components/verify-gate.tsx
interface VerifyGateProps {
  loginUrl: string;
  minutesRemaining: number;
}

export function VerifyGate({ loginUrl, minutesRemaining }: VerifyGateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="font-[family-name:var(--font-heading)] mb-8 text-2xl font-semibold tracking-tight">
        gett
      </p>
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-lg font-semibold">Verify your identity</h1>
        <p className="text-sm text-muted-foreground">
          To upload documents securely, you need to sign in first. This link
          expires in {minutesRemaining} minute{minutesRemaining !== 1 ? "s" : ""}.
        </p>
        <a
          href={loginUrl}
          className="mt-4 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Continue securely
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the /start server page**

```tsx
// src/app/start/page.tsx
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { cases } from "@/server/db/schema";
import { requireCaseMember } from "@/server/auth/case-access";
import { resolveCurrentUser } from "@/server/auth/session";
import { validateHandoffToken } from "@/server/intake/handoff";
import { createCase } from "@/server/services/cases";
import { VerifyGate } from "./_components/verify-gate";
import { UploadScanner } from "./_components/upload-scanner";

function TokenError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="font-[family-name:var(--font-heading)] mb-8 text-2xl font-semibold tracking-tight">
        gett
      </p>
      <div className="max-w-sm space-y-2 text-center">
        <p className="font-semibold">Link unavailable</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  if (!t) {
    return <TokenError message="No token provided." />;
  }

  const token = await validateHandoffToken(t);

  if (!token) {
    return (
      <TokenError message="This link has expired or has already been used. Please request a new one." />
    );
  }

  const minutesRemaining = Math.max(
    1,
    Math.floor((token.expiresAt.getTime() - Date.now()) / 60_000),
  );

  const user = await resolveCurrentUser();

  if (!user) {
    const redirectUrl = `/start?t=${encodeURIComponent(t)}`;
    const loginUrl = `/api/auth/login?post_login_redirect_url=${encodeURIComponent(redirectUrl)}`;
    return <VerifyGate loginUrl={loginUrl} minutesRemaining={minutesRemaining} />;
  }

  let caseId: string;
  let caseHash: string;

  if (token.caseId) {
    try {
      await requireCaseMember(db, user.id, token.caseId, "viewer");
    } catch {
      return <TokenError message="You do not have access to this case." />;
    }
    const c = await db.query.cases.findFirst({
      where: eq(cases.id, token.caseId),
    });
    if (!c) return <TokenError message="Case not found." />;
    caseId = c.id;
    caseHash = c.caseHash;
  } else {
    const newCase = await createCase(user.id, "Document upload", {
      source: "handoff",
    });
    caseId = newCase.id;
    caseHash = newCase.caseHash;
  }

  return <UploadScanner caseId={caseId} caseHash={caseHash} token={t} />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm check
```

Expected: UploadScanner not found error (that's fine — we'll create it next).

- [ ] **Step 4: Commit (VerifyGate + page skeleton)**

```bash
git add src/app/start/page.tsx src/app/start/_components/verify-gate.tsx
git commit -m "feat: add /start server page and VerifyGate"
```

---

## Task 13: UploadScanner client component

**Files:**
- Create: `src/app/start/_components/upload-scanner.tsx`

- [ ] **Step 1: Create UploadScanner**

```tsx
// src/app/start/_components/upload-scanner.tsx
"use client";

import { useRef, useState } from "react";
import { api } from "@/trpc/react";

interface UploadScannerProps {
  caseId: string;
  caseHash: string;
  token: string;
}

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = "image/*,application/pdf";

async function prepareFile(file: File): Promise<{ contentBase64: string; filename: string }> {
  if (file.type === "application/pdf") {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return { contentBase64: btoa(bin), filename: file.name };
  }

  // Resize image via canvas
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 2000 / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ contentBase64: dataUrl.split(",")[1]!, filename: file.name.replace(/\.[^.]+$/, ".jpg") });
    };
    img.src = objectUrl;
  });
}

export function UploadScanner({ caseId, caseHash, token }: UploadScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const upload = api.document.upload.useMutation();
  const consume = api.intake.consumeHandoff.useMutation();

  const isPending = upload.isPending || consume.isPending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError("File must be under 20MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);
    try {
      const { contentBase64, filename } = await prepareFile(file);
      await upload.mutateAsync({ caseId, filename, contentBase64 });
      await consume.mutateAsync({ token, caseId });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <p className="font-[family-name:var(--font-heading)] mb-6 text-2xl font-semibold tracking-tight">
          gett
        </p>
        <div className="space-y-2 text-center">
          <p className="font-mono text-sm text-muted-foreground">{caseHash}</p>
          <p className="text-lg font-semibold">Document uploaded</p>
          <p className="text-sm text-muted-foreground">
            Your document has been received securely. You're done.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <p className="font-[family-name:var(--font-heading)] mb-8 text-2xl font-semibold tracking-tight text-white">
        gett
      </p>

      {!preview ? (
        <div className="w-full max-w-sm space-y-4">
          {/* Camera capture frame */}
          <div
            className="relative flex h-64 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-600"
            onClick={() => inputRef.current?.click()}
          >
            {/* Corner guides */}
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span
                key={c}
                className={`absolute h-6 w-6 border-white ${
                  c === "tl" ? "left-2 top-2 border-l-2 border-t-2" :
                  c === "tr" ? "right-2 top-2 border-r-2 border-t-2" :
                  c === "bl" ? "bottom-2 left-2 border-b-2 border-l-2" :
                  "bottom-2 right-2 border-b-2 border-r-2"
                }`}
              />
            ))}
            <p className="text-sm text-zinc-400">Tap to capture or attach</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <img src={preview} alt="Preview" className="w-full rounded-lg object-contain" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setPreview(null); setFile(null); }}
              disabled={isPending}
              className="flex-1 rounded-md border border-zinc-600 py-2.5 text-sm font-medium text-zinc-300 disabled:opacity-50"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isPending}
              className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Uploading…" : "Upload this"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/start/_components/upload-scanner.tsx
git commit -m "feat: add UploadScanner client component"
```

---

## Task 14: Case detail — tab bar refactor

**Files:**
- Modify: `src/app/cases/[caseId]/_components/case-detail-client.tsx`

- [ ] **Step 1: Refactor case-detail-client.tsx to use three tabs**

Replace the entire file contents with:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

import type { Case } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { CaseCommsPanel } from "./case-comms-panel";

type AgentKind = "intake" | "summary" | "examination";
type Tab = "agent" | "audit" | "comms";

export function CaseDetailClient({ caseRecord }: { caseRecord: Case }) {
  const [activeTab, setActiveTab] = useState<Tab>("agent");
  const [input, setInput] = useState("");
  const [agentKind, setAgentKind] = useState<AgentKind>("summary");
  const [agentOutput, setAgentOutput] = useState<string | null>(null);

  const { data: events } = api.case.auditLog.useQuery({
    caseId: caseRecord.id,
  });

  const intakeAgent = api.agent.intake.useMutation({
    onSuccess: (result) => setAgentOutput(JSON.stringify(result, null, 2)),
  });
  const summaryAgent = api.agent.summarize.useMutation({
    onSuccess: (result) => setAgentOutput(result.summary),
  });

  const runSelectedAgent = () => {
    if (!input.trim()) return;
    if (agentKind === "intake") {
      intakeAgent.mutate({ caseId: caseRecord.id, messages: [input.trim()] });
    } else if (agentKind === "summary") {
      summaryAgent.mutate({ caseId: caseRecord.id });
    } else {
      setAgentOutput("Document examination requires uploading a document first.");
    }
  };

  const isPending = intakeAgent.isPending || summaryAgent.isPending;

  const TABS: { id: Tab; label: string }[] = [
    { id: "agent", label: "Agent" },
    { id: "audit", label: "Audit" },
    { id: "comms", label: "Comms" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-xl font-semibold"
          >
            gett
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="font-mono text-sm text-muted-foreground">
            {caseRecord.caseHash}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] mt-1 text-3xl font-semibold tracking-tight">
            {caseRecord.title}
          </h1>
          <p className="mt-2 capitalize text-muted-foreground">
            Status: {caseRecord.status.replace("_", " ")}
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-2">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Agent tab */}
        {activeTab === "agent" && (
          <section className="rounded-lg border border-border p-6">
            <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
              Run agent
            </h2>
            <div className="mb-3 flex gap-2">
              {(
                [
                  ["intake", "Intake"],
                  ["summary", "Summary"],
                  ["examination", "Document exam"],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAgentKind(type)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    agentKind === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                agentKind === "summary"
                  ? "Summary uses case data — optional notes…"
                  : "Describe what you need the agent to do…"
              }
              rows={4}
              className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={(agentKind !== "summary" && !input.trim()) || isPending}
              onClick={runSelectedAgent}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Running…" : "Run agent"}
            </button>
            {agentOutput && (
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                {agentOutput}
              </pre>
            )}
          </section>
        )}

        {/* Audit tab */}
        {activeTab === "audit" && (
          <section>
            <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
              Audit trail
            </h2>
            {events && events.length > 0 ? (
              <ul className="space-y-2">
                {events.map(
                  (event: {
                    id: string;
                    eventType: string;
                    createdAt: Date;
                  }) => (
                    <li
                      key={event.id}
                      className="rounded-md border border-border px-4 py-3 text-sm"
                    >
                      <div className="flex justify-between gap-4">
                        <span className="font-medium">{event.eventType}</span>
                        <time className="text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString()}
                        </time>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="text-muted-foreground">No events recorded yet.</p>
            )}
          </section>
        )}

        {/* Comms tab */}
        {activeTab === "comms" && (
          <CaseCommsPanel caseId={caseRecord.id} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm check
```

Expected: CaseCommsPanel not found (fixed in next task).

- [ ] **Step 3: Commit**

```bash
git add src/app/cases/[caseId]/_components/case-detail-client.tsx
git commit -m "feat: refactor case detail into Agent/Audit/Comms tabs"
```

---

## Task 15: Case Comms panel

**Files:**
- Create: `src/app/cases/[caseId]/_components/case-comms-panel.tsx`

- [ ] **Step 1: Create the comms panel**

```tsx
// src/app/cases/[caseId]/_components/case-comms-panel.tsx
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { buildTelUrl } from "@/lib/comms/sms-url";
import type { TemplateId } from "@/lib/comms/templates";

function CaseCommsHistory({ caseId }: { caseId: string }) {
  const { data: messages } = api.comms.getCaseMessages.useQuery({ caseId });
  if (!messages?.length) return null;
  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
        History
      </h2>
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id} className="rounded-md border border-border px-4 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-medium">{m.templateId} · {m.channel}</span>
              <time className="text-muted-foreground">
                {new Date(m.createdAt).toLocaleString()}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CaseCommsPanelProps {
  caseId: string;
}

interface PreviewResult {
  previewBody: string;
  smsUrl: string;
  handoffUrl: string;
  expiresAt: Date;
}

const isMobile =
  typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

export function CaseCommsPanel({ caseId }: CaseCommsPanelProps) {
  const { data: contacts, refetch: refetchContacts } =
    api.comms.getCaseContacts.useQuery({ caseId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  const upsert = api.comms.upsertCaseContact.useMutation({
    onSuccess: () => {
      void refetchContacts();
      setShowAddForm(false);
      setDisplayName("");
      setPhoneE164("");
      setSmsConsent(false);
    },
  });

  const [templateId, setTemplateId] = useState<TemplateId>("secure_upload");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);

  const buildTemplate = api.comms.buildMessageTemplate.useMutation({
    onSuccess: (data) => setPreview(data as PreviewResult),
  });

  const logSent = api.comms.logOutboundComms.useMutation({
    onSuccess: () => setLogged(true),
  });

  const clientContact = contacts?.find((c) => c.role === "client");

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border p-6">
        <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
          Client contact
        </h2>

        {clientContact ? (
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
            <span className="font-medium">{clientContact.displayName}</span>
            <span className="text-muted-foreground">{clientContact.phoneE164}</span>
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">No client contact yet.</p>
        )}

        {showAddForm ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              upsert.mutate({
                caseId,
                role: "client",
                phoneE164,
                displayName,
                smsConsentAt: smsConsent ? new Date() : undefined,
              });
            }}
          >
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
              placeholder="+15551234567"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
              />
              Client has consented to SMS communication
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={upsert.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {upsert.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            {clientContact ? "Update contact" : "+ Add contact"}
          </button>
        )}
      </div>

      {clientContact && (
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
            Send template
          </h2>

          <div className="mb-4 flex gap-2">
            {(["secure_upload", "reminder"] as TemplateId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTemplateId(id); setPreview(null); setLogged(false); }}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  templateId === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {id === "secure_upload" ? "Secure upload" : "Reminder"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setLogged(false);
              buildTemplate.mutate({ caseId, templateId });
            }}
            disabled={buildTemplate.isPending}
            className="mb-4 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            {buildTemplate.isPending ? "Generating…" : "Preview"}
          </button>

          {preview && (
            <div className="space-y-4">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
                {preview.previewBody}
              </pre>
              <p className="text-xs text-muted-foreground">
                Link expires at {new Date(preview.expiresAt).toLocaleTimeString()}
              </p>

              <div className="flex flex-wrap gap-2">
                {isMobile && (
                  <a
                    href={preview.smsUrl}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Text client
                  </a>
                )}
                <a
                  href={buildTelUrl(clientContact.phoneE164)}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Call client
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(preview.handoffUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  type="button"
                  disabled={logged || logSent.isPending}
                  onClick={() => logSent.mutate({ caseId, templateId, channel: "sms" })}
                  className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
                >
                  {logged ? "Logged ✓" : "I sent this"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {contacts && contacts.length > 0 && (
        <CaseCommsHistory caseId={caseId} />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/cases/[caseId]/_components/case-comms-panel.tsx
git commit -m "feat: add Case Comms panel with contact management and template sending"
```

---

## Task 16: Twilio webhook scaffold

**Files:**
- Create: `src/app/api/intake/sms/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/intake/sms/route.ts
import { createHmac } from "node:crypto";

import { env } from "@/env";
import { createHandoffToken } from "@/server/intake/handoff";
import { detectSensitiveIntent } from "@/server/intake/sensitivity";

function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  const sortedKeys = Object.keys(params).sort();
  const str = url + sortedKeys.map((k) => k + (params[k] ?? "")).join("");
  const expected = createHmac("sha1", authToken).update(str).digest("base64");
  return expected === signature;
}

function twiml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!env.TWILIO_AUTH_TOKEN) {
    return new Response("SMS intake not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody).entries());

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = request.url;

  if (!validateTwilioSignature(env.TWILIO_AUTH_TOKEN, url, params, signature)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = params.Body ?? "";
  const from = params.From ?? "";
  const numMedia = parseInt(params.NumMedia ?? "0", 10);

  const isSensitive = detectSensitiveIntent(body, numMedia > 0);

  if (!isSensitive) {
    return twiml(
      "Thanks for reaching out. Reply UPLOAD when you're ready to share documents securely.",
    );
  }

  const { raw, expiresAt } = await createHandoffToken({
    channel: "sms",
    intent: "upload",
    phoneE164: from,
  });

  const link = `${env.SITE_URL}/start?t=${raw}`;
  const expiryMin = Math.round(env.HANDOFF_TOKEN_TTL_MINUTES);

  return twiml(
    `For your privacy, upload securely (expires ${expiryMin} min): ${link}`,
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/intake/sms/route.ts
git commit -m "feat: add Twilio SMS inbound webhook scaffold"
```

---

## Task 17: Full test suite + acceptance verification

- [ ] **Step 1: Run all unit tests**

```bash
pnpm test
```

Expected: all tests in `src/__tests__/` pass. Count should be ≥ 17.

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm check
```

Expected: no type errors.

- [ ] **Step 3: Run build to catch runtime issues**

```bash
pnpm build
```

Expected: build completes without errors. Fix any issues before continuing.

- [ ] **Step 4: Manual P1 acceptance — web handoff**

Start dev server:
```bash
pnpm dev
```

In another terminal, create a test handoff token in the REPL or via Drizzle Studio, or call `api.intake.createHandoffLink` from a logged-in session. Then:

- Open `http://localhost:3000/start?t=<raw_token>` while logged out → VerifyGate appears
- Click "Continue securely" → Kinde login → lands on UploadScanner
- Select an image → preview appears → click "Upload this"
- Success screen shows `GETT-XXXX` case hash

- [ ] **Step 5: Manual P3 acceptance — Comms tab**

- Navigate to any case as a user with `member` role
- Click the **Comms** tab
- Add a client contact (phone + name + consent checkbox)
- Select "Secure upload" template → click Preview
- Verify preview body contains case hash + `start?t=`
- Click "I sent this" → button shows "Logged ✓"
- On mobile: verify "Text client" button appears and opens Messages with prefilled body

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete secure intake, upload, and case comms (P1-P3)"
```

---

## Acceptance criteria reference

From spec — verify each before shipping:

**P1 — Web handoff**
- [ ] `GET /start?t=valid` unauthenticated → VerifyGate
- [ ] Login → UploadScanner without second tap
- [ ] Photo on iOS Safari → uploads to case
- [ ] Token consumed only after successful upload
- [ ] Expired token → TokenError
- [ ] Consumed token → TokenError
- [ ] `case_events` contains `document.uploaded` and `handoff.consumed`

**P2 — SMS scaffold**
- [ ] `TWILIO_AUTH_TOKEN` absent → 503
- [ ] Invalid Twilio signature → 403
- [ ] MMS (NumMedia > 0) → reply with handoff link (no media stored)
- [ ] Sensitive keyword → reply with handoff link

**P3 — Case Comms tab**
- [ ] Comms tab visible on case detail page
- [ ] Add contact saves to `case_contacts`
- [ ] Preview body contains caseHash + `/start?t=`
- [ ] Mobile: "Text client" opens Messages with prefilled body
- [ ] Desktop: "Copy link" copies handoffUrl
- [ ] "I sent this" → `case_messages` row + audit event

**Security**
- [ ] Raw token never in server logs or DB (only `tokenHash`)
- [ ] `phoneE164` not in server-side URLs or logs
- [ ] User cannot upload without case membership
- [ ] `ALLOW_PHI_PROCESSING=false` + real R2 → upload blocked
