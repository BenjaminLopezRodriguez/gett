# Secure Intake, Upload & Case Comms — Design Spec
Date: 2026-06-18
Scope: P1–P3 (handoff tokens, /start upload page, Twilio webhook scaffold, Case Comms tab)

---

## 1. Context

### Existing stack
- Next.js 15 App Router, tRPC 11, Drizzle ORM, Neon Postgres
- Kinde auth: `src/app/api/auth/[kindeAuth]/route.ts`, `src/server/auth/session.ts`
- Case RBAC: `requireCaseMember`, `caseProcedure` in `src/server/api/trpc.ts`
- Document upload: `src/server/api/routers/document.ts` → `src/server/pdf/upload.ts` → Cloudflare R2
- Audit events: `caseEvents` via `logCaseEvent` in `src/server/services/cases.ts`
- Role hierarchy: viewer < lawyer < member < owner

### Product rules encoded in code
```
PUBLIC_CHANNEL   → triage/educate only; no PHI storage
SENSITIVITY_GATE → auth handoff before case/doc data
AUTHENTICATED    → cases, uploads, agents, comms templates
SMS_BODY         → case ref + secure link only; never clinical detail
PRE_AUTH_MMS     → reject; do not persist file bytes
```

### Sensitivity triggers (rule-based v1)
- MMS attachment received
- Keywords: doctor, diagnosis, employer name + injury, SSN, DOB, upload, document, MRI, claim #
- User selects "start my case" / "talk to a lawyer about my situation"

---

## 2. Data layer

### New table: `intake_handoff_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tokenHash` | varchar(64) UNIQUE NOT NULL | sha256(raw); raw never stored |
| `channel` | enum `sms\|web\|voice` | |
| `phoneE164` | varchar(20) nullable | hint only; unverified until P4 OTP |
| `intent` | enum `upload\|intake\|general` | default `upload` |
| `intentMeta` | jsonb | non-PHI only e.g. `{ category: 'workers_comp' }` |
| `caseId` | uuid nullable FK → cases | pre-bound by lawyer (Option C); null for SMS-triggered flows |
| `userId` | uuid nullable FK → users | set on consume |
| `expiresAt` | timestamptz NOT NULL | `createdAt + HANDOFF_TOKEN_TTL_MINUTES` |
| `consumedAt` | timestamptz nullable | single-use gate; set atomically after successful upload |
| `createdAt` | timestamptz NOT NULL | |

Rules:
- TTL: `HANDOFF_TOKEN_TTL_MINUTES` env var (default 20)
- Single-use: `consumedAt` set only after `document.upload` returns success
- Only `tokenHash` is ever stored, logged, or returned to clients
- Token is consumed after upload success, not on auth — prevents burning token on network error

### New table: `case_contacts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `caseId` | uuid FK → cases | |
| `role` | enum `client\|lawyer\|adjuster` | |
| `phoneE164` | varchar(20) | |
| `displayName` | varchar(256) | |
| `smsConsentAt` | timestamptz nullable | |
| UNIQUE | `(caseId, phoneE164, role)` | |

### New table: `case_messages` (stub — audit only, no body)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `caseId` | uuid FK → cases | |
| `direction` | enum `in\|out` | |
| `templateId` | varchar | which template was used |
| `channel` | enum `sms\|call` | |
| `actorId` | uuid FK → users | lawyer who prepared/sent |
| `createdAt` | timestamptz | |

No `body` column — body is always reconstructible from `templateId` + `caseHash` + `handoffUrl`. Avoids PHI risk in this table.

---

## 3. Handoff token service

**File:** `src/server/intake/handoff.ts`

```ts
generateToken(): { raw: string; hash: string }
// raw = 32 bytes crypto.randomBytes hex; hash = sha256(raw)

createHandoffToken(input: {
  channel: 'sms'|'web'|'voice'
  intent?: 'upload'|'intake'|'general'
  phoneE164?: string
  caseId?: string
  intentMeta?: Record<string, string>
}): Promise<{ raw: string; expiresAt: Date }>
// Inserts tokenHash only; returns raw for URL construction

validateHandoffToken(raw: string): Promise<HandoffToken | null>
// sha256(raw) lookup; returns null if not found, expired, or already consumed

consumeHandoffToken(raw: string, userId: string): Promise<void>
// Sets consumedAt atomically; no-op if already consumed by same user; throws if consumed by different user
```

---

## 4. `/start` page

**File:** `src/app/start/page.tsx`

### Server flow

```
GET /start?t=<raw>
  ├─ validateHandoffToken(t)
  │    └─ invalid/expired → <TokenError> (no nav; "This link has expired" + contact copy)
  ├─ no Kinde session
  │    └─ <VerifyGate token={t} expiresAt={...} />
  └─ session exists
       ├─ token.caseId set → requireCaseMember(caseId, userId, 'viewer') → use existing case
       └─ token.caseId null → createCase(userId, 'Document upload', { source: 'handoff' })
       └─ render <UploadScanner caseId={...} caseHash={...} token={raw} />
       // token NOT consumed here — consumed after successful upload
```

### `<VerifyGate>` (`src/app/start/_components/verify-gate.tsx`)
- Full-page, no nav, no marketing chrome
- gett wordmark centered
- Subtext: "Verify your identity to upload documents securely. This link expires in X minutes."
- `X` computed from `expiresAt - now` at render time
- Single primary CTA → `/api/auth/login?post_login_redirect_url=/start?t=<same_t>`

### `<UploadScanner>` (`src/app/start/_components/upload-scanner.tsx`)
- Full dark viewport with CSS corner-guide overlay (no canvas)
- `<input type="file" accept="image/*,application/pdf" capture="environment" />`
  - Mobile: triggers camera; desktop: file picker
- Preview step: thumbnail + "Upload this" / "Retake"
- Client-side resize before base64: max width 2000px, JPEG quality 0.85
- Calls `api.document.upload.mutate({ caseId, filename, contentBase64 })`
- On upload success:
  1. Call `api.intake.consumeHandoff.mutate({ token, caseId })`
  2. Render success screen: `GETT-XXXX` hash + "You're done" copy
- Inline error states: file too large (>20MB), wrong type, network failure — token NOT consumed on error

### Middleware change (`src/middleware.ts`)
Add `/start` to `publicPaths`. The page handles auth state internally; Kinde middleware must not redirect away from it before the page can read the token.

---

## 5. tRPC routers

### `src/server/api/routers/intake.ts`

**`createHandoffLink`** — `protectedProcedure`
```ts
input: { caseId?: string, intent?: 'upload'|'intake', phoneE164?: string }
// If caseId: verify caller has >= member role before creating token
// Returns: { url: `${SITE_URL}/start?t=<raw>`, expiresAt }
```

**`resolveHandoff`** — `publicProcedure`
```ts
input: { token: string }
// Returns: { valid, expired, intent, caseId?, minutesRemaining }
// Never returns phoneE164 or userId
```

**`consumeHandoff`** — `protectedProcedure`
```ts
input: { token: string, caseId: string }
// consumeHandoffToken(token, ctx.user.id)
// logCaseEvent(caseId, userId, 'handoff.consumed', { intent })
```

### `src/server/api/routers/comms.ts`

**`getCaseContacts`** — `caseProcedure('viewer')`

**`upsertCaseContact`** — `caseProcedure('member')`
```ts
input: { caseId, role, phoneE164, displayName, smsConsentAt? }
// on conflict (caseId, phoneE164, role) → update displayName, smsConsentAt
```

**`buildMessageTemplate`** — `caseProcedure('member')`
```ts
input: { caseId, templateId: 'secure_upload'|'reminder' }
// 1. createHandoffToken({ caseId, intent: 'upload', channel: 'sms' })
// 2. body = TEMPLATES[templateId](case.caseHash, handoffUrl)
// 3. logCaseEvent(caseId, userId, 'comms.template_prepared', { templateId })
// Returns: { previewBody, smsUrl, handoffUrl, expiresAt }
// smsUrl = buildSmsUrl(contact.phoneE164, body)  ← for client-side use only
```

**`logOutboundComms`** — `caseProcedure('member')`
```ts
input: { caseId, templateId, channel: 'sms'|'call' }
// insert case_messages (no body)
// logCaseEvent(caseId, userId, 'comms.sent', { templateId, channel })
```

### Mount in `src/server/api/root.ts`
```ts
intake: intakeRouter,
comms: commsRouter,
```

---

## 6. Comms helpers

### `src/lib/comms/templates.ts`
```ts
export const TEMPLATES = {
  secure_upload: (caseHash: string, url: string) =>
    `Please upload your document securely for case ${caseHash}: ${url}`,
  reminder: (caseHash: string, url: string) =>
    `Reminder — secure upload link for case ${caseHash}: ${url}`,
} as const
// Max ~140 chars; no diagnosis, employer, dates of injury
```

### `src/lib/comms/sms-url.ts`
```ts
export function buildSmsUrl(phoneE164: string, body: string): string {
  return `sms:${phoneE164}?body=${encodeURIComponent(body)}`
}
export function buildTelUrl(phoneE164: string): string {
  return `tel:${phoneE164}`
}
```
These are imported client-side only. `phoneE164` never appears in server logs or URL query strings.

---

## 7. Case Comms tab UI

**File:** `src/app/cases/[caseId]/_components/case-comms-panel.tsx`

`case-detail-client.tsx` is refactored from two inline sections into a three-tab layout:
- **Agent** (existing Run agent section, content unchanged)
- **Audit** (existing Audit trail section, content unchanged)
- **Comms** (new)

Tab bar uses same button style as the existing agent-kind selector.

### Comms tab sections

**Contact section**
- Shows `getCaseContacts` result for `role: 'client'`
- If none: inline "Add contact" form (`displayName`, `phoneE164`, SMS consent checkbox) → `upsertCaseContact`

**Template section** (visible only if client contact exists)
- Dropdown: `secure_upload` | `reminder`
- "Preview" button → `buildMessageTemplate` → read-only `<pre>` block with full body + expiry

**Send actions** (appear after preview is generated)
- **[ Text client ]** → `window.location.href = smsUrl` (mobile)
- **[ Copy link ]** → copies `handoffUrl` to clipboard (desktop primary; shown when `!navigator.maxTouchPoints`)
- **[ I sent this ]** → `logOutboundComms` → button disabled, shows "Logged"

**History section**
- List from `case_messages`: `templateId` + timestamp + actor
- `viewer` role: history only; `member+`: full send UI visible

---

## 8. Twilio webhook scaffold

**File:** `src/app/api/intake/sms/route.ts`

Returns 503 if `TWILIO_AUTH_TOKEN` is not set (safe to deploy without live credentials).

When env var is present:
1. Validate `X-Twilio-Signature` — reject 403 if invalid
2. Parse `Body`, `From`, `NumMedia` from form-encoded POST body
3. `NumMedia > 0` (MMS) → skip media; reply with handoff link (createHandoffToken, channel: 'sms', phoneE164: From)
4. `detectSensitiveIntent(Body, false)` → createHandoffToken → reply with secure link
5. Else → reply with generic triage TwiML

TwiML reply format:
```xml
<Response><Message>For your privacy, upload securely (expires 20 min): https://gett.md/start?t=<raw></Message></Response>
```

Nothing from `Body` or `From` is written to the DB. Only the token creation is persisted.

### `src/server/intake/sensitivity.ts`
```ts
export function detectSensitiveIntent(text: string, hasMedia: boolean): boolean
```
Keyword list: doctor, diagnosis, employer, injury, SSN, DOB, upload, document, MRI, claim. Pure function; easy to swap for LLM classifier later.

---

## 9. Privacy guards

**File:** `src/server/lib/phi-guard.ts`
```ts
export function assertPhiProcessingAllowed(): void
// throws TRPCError PRECONDITION_FAILED if !env.ALLOW_PHI_PROCESSING

export function assertAiProcessingAllowed(): void
// throws TRPCError PRECONDITION_FAILED if !env.ALLOW_AI_PROCESSING
```

Called from:
- `document.upload` — guards real R2 write
- `agent.examineDocument`, `agent.intake` — guards AI calls

### New env vars (`src/env.js` + `.env.example`)
```
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
HANDOFF_TOKEN_TTL_MINUTES="20"
SITE_URL="https://gett.md"
ALLOW_PHI_PROCESSING="false"
ALLOW_AI_PROCESSING="false"
```

---

## 10. File checklist

| Action | Path |
|---|---|
| Create | `src/app/start/page.tsx` |
| Create | `src/app/start/_components/verify-gate.tsx` |
| Create | `src/app/start/_components/upload-scanner.tsx` |
| Create | `src/server/intake/handoff.ts` |
| Create | `src/server/intake/sensitivity.ts` |
| Create | `src/server/lib/phi-guard.ts` |
| Create | `src/lib/comms/templates.ts` |
| Create | `src/lib/comms/sms-url.ts` |
| Create | `src/server/api/routers/intake.ts` |
| Create | `src/server/api/routers/comms.ts` |
| Create | `src/app/cases/[caseId]/_components/case-comms-panel.tsx` |
| Create | `src/app/api/intake/sms/route.ts` |
| Modify | `src/server/db/schema.ts` + migration |
| Modify | `src/server/api/root.ts` |
| Modify | `src/env.js` |
| Modify | `src/middleware.ts` |
| Modify | `src/app/cases/[caseId]/_components/case-detail-client.tsx` (add tab bar) |
| Modify | `src/server/api/routers/document.ts` (add phi-guard) |
| Modify | `.env.example` |

---

## 11. Acceptance criteria

### P1 — Web handoff
- [ ] `GET /start?t=valid` unauthenticated → VerifyGate renders
- [ ] Login → lands on UploadScanner without second tap
- [ ] Capture photo on iOS Safari → uploads to correct case
- [ ] Token consumed only after successful upload
- [ ] Expired token → TokenError page
- [ ] Reused (consumed) token → rejected with error
- [ ] `case_events` contains `document.uploaded` and `handoff.consumed`

### P2 — SMS scaffold
- [ ] MMS to endpoint → no media stored; TwiML reply with handoff link
- [ ] Sensitive keyword → TwiML reply with handoff link
- [ ] Link from reply works through P1 flow
- [ ] Missing `TWILIO_AUTH_TOKEN` → 503
- [ ] Invalid Twilio signature → 403

### P3 — Case Comms tab
- [ ] Comms tab visible on case detail page
- [ ] "Add contact" saves to `case_contacts`
- [ ] Preview shows body containing caseHash + `gett.md/start?t=`
- [ ] "Text client" opens Messages with prefilled body (mobile)
- [ ] "Copy link" copies handoffUrl (desktop)
- [ ] "I sent this" creates `case_messages` row + audit event
- [ ] Viewer role sees history only, no send UI

### Security
- [ ] Raw token never appears in server logs or DB
- [ ] `phoneE164` not in any server-side URL or log
- [ ] User cannot upload to a case without membership
- [ ] `ALLOW_PHI_PROCESSING=false` blocks upload path in prod
