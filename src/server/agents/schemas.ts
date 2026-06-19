import { z } from "zod";

export const intakeOutputSchema = z.object({
  summary: z.string(),
  leaveType: z.enum(["fmla", "ada", "state", "disability", "unknown"]),
  urgency: z.enum(["low", "medium", "high"]),
  missingDocuments: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
  caseId: z.string().uuid().optional(),
});

export type IntakeOutput = z.infer<typeof intakeOutputSchema>;

export const examinationOutputSchema = z.object({
  compliant: z.boolean(),
  flags: z.array(
    z.object({
      severity: z.enum(["info", "warning", "critical"]),
      message: z.string(),
      citation: z.string().optional(),
    }),
  ),
  summary: z.string(),
});

export type ExaminationOutput = z.infer<typeof examinationOutputSchema>;
