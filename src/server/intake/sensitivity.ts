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
