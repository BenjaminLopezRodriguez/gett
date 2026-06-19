# HIPAA Business Associate Agreement — HHS Sample Provisions

## What this file is
Sample Business Associate Agreement (BAA) provisions published by the U.S. Department of Health and Human Services (HHS), Office for Civil Rights (OCR). Guidance document for covered entities and business associates on the required contractual provisions under HIPAA Privacy Rule (45 CFR §164.504(e)) and HITECH Act. English. Published at hhs.gov.

**NOTE: PDF not in corpus. HHS.gov returns 403 to automated downloads. Download manually from the URL below.**

## Provenance
- **Source URL:** https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html
- **Downloaded:** NOT DOWNLOADED — blocked by HHS.gov CDN (403 Forbidden to curl)
- **Source legitimacy:** Tier 1 — hhs.gov is the official U.S. Department of Health and Human Services domain (.gov). Confirmed authoritative.
- **SHA256:** not available (file not downloaded)
- **Size / type:** not available (HTML page, not PDF; may print-to-PDF)

**To add to corpus:** Open the URL above in a browser, print or save as PDF to this folder as `hipaa-baa-sample.pdf`, then update this CONTEXT.md with SHA256 and size.

## What it's for / when it's used
A Business Associate Agreement (BAA) is required by HIPAA whenever a covered entity (e.g., a health care provider, health plan) shares Protected Health Information (PHI) with a business associate that handles PHI on the covered entity's behalf. For the gett platform: if gett stores, transmits, or processes PHI (medical records, claim documents) on behalf of attorney clients who are covered entities, or on behalf of clients whose PHI is involved, a BAA may be required between gett and those parties.

The HHS sample provisions describe the minimum required BAA content — they are not a ready-to-sign agreement, but rather a template of required clauses.

## Key information an LLM needs (based on HHS published guidance — verify against actual page)
**Required BAA provisions under 45 CFR §164.504(e)(2):**
- Permitted and required uses of PHI (only for covered functions)
- Prohibition on using or disclosing PHI other than as permitted by the agreement or required by law
- Safeguards to prevent unauthorized use or disclosure
- Obligation to report unauthorized use, disclosure, or security incident to covered entity
- Subcontractors must agree to the same restrictions (downstream BAAs)
- Allow individual access to their PHI
- Incorporate minimum necessary limitation
- Return or destroy PHI at end of contract (or provide justification for retention)
- Business associate must comply with Security Rule (45 CFR Part 164, Subparts A and C)

**Relevance to gett platform:**
- The `assertPhiProcessingAllowed()` guard in `src/server/lib/phi-guard.ts` is the code-side enforcement of PHI handling restrictions
- `ALLOW_PHI_PROCESSING=false` is the production default — gett intentionally delays PHI processing until this guard is properly configured
- Any production deployment that handles real client medical documents requires a BAA between gett (as business associate) and the law firm (if covered entity) or other applicable parties

**HITECH note:** The HITECH Act (2009) extended HIPAA Security Rule obligations directly to business associates. BAs are now directly liable for Security Rule violations, not just contractually liable. The BAA must reflect this.

## Related documents
- Implementation: `src/server/lib/phi-guard.ts` — see `assertPhiProcessingAllowed()` and `assertAiProcessingAllowed()`
- `cfra-certification-en` — medical records relevant to HIPAA; HCP releases must comply with Privacy Rule
- `form-5021` — Doctor's First Report contains PHI requiring HIPAA-compliant handling

## Open questions
- HHS updates the BAA sample provisions periodically. The URL above is the canonical source — retrieve a fresh copy before drafting any actual BAA.
- California has its own Confidentiality of Medical Information Act (CMIA) — stricter than HIPAA in some respects. Any BAA for California medical records should be reviewed against CMIA as well. Not in corpus.
- Attorney-client privilege intersects with HIPAA when a law firm holds medical records obtained for litigation. The BAA analysis for law firms as covered entities vs. business associates is nuanced — recommend specialized legal review.
