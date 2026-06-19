export const TEMPLATES = {
  secure_upload: (caseHash: string, url: string) =>
    `Upload securely for case ${caseHash}: ${url}`,
  reminder: (caseHash: string, url: string) =>
    `Reminder — secure upload link for case ${caseHash}: ${url}`,
} as const;

export type TemplateId = keyof typeof TEMPLATES;
