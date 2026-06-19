# Legal Corpus — Verified Sources

This file records every domain used in this corpus, how it was verified as authoritative, and which documents it supplied.

---

## Tier 1 — Official Government Domains

### dir.ca.gov
**Agency:** California Department of Industrial Relations (DIR)  
**Verification:** .ca.gov TLD; California state government official domain. Parent of both DWC (Division of Workers' Compensation) and Cal/OSHA (Division of Occupational Safety and Health).  
**Documents supplied:**
- `dwc-form-1-en/` — DWC Form 1 (workers' comp claim form)
- `form-5021/` — Form 5021 (Doctor's First Report)
- `dwc-pr-2/` — DWC Form PR-2 (Treating Physician's Progress Report)
- `dwc-rfa-9785/` — DWC Form RFA (Request for Authorization)
- `cal-osha-300/` — Cal/OSHA Form 300 (Injury/Illness Log)
- `cal-osha-300a/` — Cal/OSHA Form 300A (Annual Summary)
- `cal-osha-301/` — Cal/OSHA Form 301 (Incident Report)

### calcivilrights.ca.gov
**Agency:** California Civil Rights Department (CRD), formerly Department of Fair Employment and Housing (DFEH)  
**Verification:** .ca.gov TLD; California state government official domain. CRD was renamed from DFEH in 2022. Confirmed as official source for CFRA forms via the agency's forms index at calcivilrights.ca.gov/forms.  
**Documents supplied:**
- `cfra-certification-en/` — CFRA Certification HCP (English, CRD-E11P-ENG)
- `cfra-certification-es/` — CFRA Certification HCP (Spanish, CRD-E11P-SP)
- `cfra-pregnancy-leave-poster-en/` — CFRA & Pregnancy Leave workplace poster (CRD-100-21ENG)

### osha.gov
**Agency:** U.S. Department of Labor, Occupational Safety and Health Administration  
**Verification:** .gov TLD; official federal agency domain. Files downloaded from osha.gov/sites/default/files/ (official OSHA file distribution path).  
**Documents supplied:**
- `osha-300-forms-package-en/` — Federal OSHA Forms 300/300A/301 package (English)
- `osha-300-forms-package-es/` — Federal OSHA Forms 300/300A package (Spanish)

### dol.gov
**Agency:** U.S. Department of Labor, Wage and Hour Division  
**Verification:** .gov TLD; official federal agency domain. Forms hosted at dol.gov/sites/dolgov/files/WHD/ (WHD = Wage and Hour Division official file path). CDN blocks automated download; manual browser download required.  
**Documents supplied (stubs — no PDFs yet):**
- `fmla-wh-380-e/` — FMLA WH-380-E certification (employee's own condition)
- `fmla-wh-380-f/` — FMLA WH-380-F certification (family member's condition)
- `fmla-wh-381/` — FMLA WH-381 (Notice of Eligibility)
- `fmla-wh-382/` — FMLA WH-382 (Designation Notice)

### hhs.gov
**Agency:** U.S. Department of Health and Human Services, Office for Civil Rights  
**Verification:** .gov TLD; official federal agency domain. CDN blocks automated download; manual browser retrieval required.  
**Documents supplied (stubs — no PDFs yet):**
- `hipaa-baa-sample/` — HHS HIPAA BAA sample provisions

---

## Domains Evaluated and Rejected

*(Documented to prevent future sessions from revisiting these)*

- `healthforcalifornia.com` — Commercial insurance broker, not official. Red flag: "Get a Quote" CTA, licensed insurance agency footer disclosure.
- Any domain with `gclid=`, `gad_source=`, or `utm_*` parameters — ad-traffic redirect; imitator site.
- State workers' comp form aggregator sites — may be out of date; always trace back to dir.ca.gov.

---

## Corpus Status

| Folder | PDF in corpus | CONTEXT.md complete |
|---|---|---|
| `dwc-form-1-en` | ✓ | ✓ |
| `form-5021` | ✓ | ✓ |
| `dwc-pr-2` | ✓ | ✓ |
| `dwc-rfa-9785` | ✓ | ✓ |
| `cfra-certification-en` | ✓ | ✓ |
| `cfra-certification-es` | ✓ | ✓ |
| `cfra-pregnancy-leave-poster-en` | ✓ | ✓ |
| `osha-300-forms-package-en` | ✓ | ✓ |
| `osha-300-forms-package-es` | ✓ | ✓ |
| `cal-osha-300` | ✓ | ✓ |
| `cal-osha-300a` | ✓ | ✓ |
| `cal-osha-301` | ✓ | ✓ |
| `fmla-wh-380-e` | ✗ blocked | ✓ stub |
| `fmla-wh-380-f` | ✗ blocked | ✓ stub |
| `fmla-wh-381` | ✗ blocked | ✓ stub |
| `fmla-wh-382` | ✗ blocked | ✓ stub |
| `hipaa-baa-sample` | ✗ blocked | ✓ stub |
