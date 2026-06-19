# Form 5021 — Doctor's First Report of Occupational Injury or Illness

## What this file is
California mandatory reporting form filed by the treating physician (or their employer) after the initial medical examination of a work-injured patient. Issued by California Department of Industrial Relations. Form number: Form 5021, Rev.5 10/2015. English. 3-page NCR (multi-part) document — physician keeps one copy, sends remainder to insurer (or employer if uninsured).

## Provenance
- **Source URL:** https://www.dir.ca.gov/dwc/forms/5021.pdf
- **Downloaded:** 2026-06-18
- **Source legitimacy:** Tier 1 — dir.ca.gov is the official California DIR domain (.ca.gov)
- **SHA256:** cba3cf4946ce53a036efc2ffdc79a412b59f470913a2d0de595002fcd9d963fd
- **Size / type:** 1301760 bytes / application/pdf

## What it's for / when it's used
Required by California Labor Code §6409(a) whenever a physician treats a patient for a work-related injury or illness. Must be sent to the employer's insurer (or employer if self-insured) within 5 working days of the initial examination. Also sent to the employer if the insurer is unknown. This is the first medical record establishing the occupational injury in the workers' comp system.

Separate from DWC Form 1 (the employee claim form) — both are required, filed by different parties.

## Key information an LLM needs
**Key fields (numbered on form):**
1. Insurer name and address
2. Employer name, address, business type
3. Employer's account/policy number
4. Patient name, home address
5. Date of birth
6. Sex
7. Date of injury
8. Occupation (specific job title)
9. Employment status (regular, part-time, seasonal, etc.)
10. Address where injury occurred
11. **Patient's social security number (SSN)** — field #11 explicitly requests SSN; high PHI sensitivity
12. Date injury reported to employer
13. Parts of body affected (checkboxes: head, neck, trunk, upper/lower extremities, other)
14. ICD-10-CM diagnosis codes — up to 12 codes
15. Work status: Can patient work? (Yes/No), return to regular work date, modified/restricted work date, restrictions description
16. Type of injury/illness (codes provided on form)
17. Treatment rendered at initial exam (narrative)
18. Hospitalization required (Yes/No); hospital name and address if yes
19. Objective findings (clinical exam results)
20. Physician's name, license number, specialty, address, signature, date

**Deadlines:**
- Physician must file within 5 working days of the initial examination
- If the injury is due to pesticide poisoning: must also send a copy to California DIR (P.O. Box 420603, San Francisco, CA 94142) AND notify the local health officer within 24 hours

**Special case — Pesticide poisoning:** Dual reporting obligation: (1) standard Form 5021 to insurer/employer, plus (2) copy to DIR + verbal notification to local health officer within 24 hours. This is an unusual urgency requirement.

**PHI sensitivity:** Field #11 (SSN), field #5 (DOB), field #14 (ICD-10 diagnoses), field #17 (treatment details). This form is high-PHI — do not transmit or store without appropriate protections.

**No employee signature required** — physician/their staff fills and signs only.

## Related documents
- `dwc-form-1-en` — Employee's claim form (DWC Form 1); filed by employee, not physician
- `dwc-pr-2` — PR-2 Progress Report; physician files for ongoing treatment reporting
- `dwc-rfa-9785` — Request for Authorization; physician files to get specific treatments approved

## Open questions
- Rev.5 10/2015 — verify no Rev.6 or later issued at dir.ca.gov/dwc/forms.html.
- ICD-10-CM: form doesn't specify which year's edition; current year's codes apply in practice.
- Some counties may have additional local reporting requirements for specific injury types.
