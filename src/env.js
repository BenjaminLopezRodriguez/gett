import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Kinde Auth
    KINDE_CLIENT_ID: z.string().min(1).optional(),
    KINDE_CLIENT_SECRET: z.string().min(1).optional(),
    KINDE_ISSUER_URL: z.string().url().optional(),
    KINDE_SITE_URL: z.string().url().optional(),
    KINDE_POST_LOGOUT_REDIRECT_URL: z.string().url().optional(),
    KINDE_POST_LOGIN_REDIRECT_URL: z.string().url().optional(),

    // Anthropic / Claude
    ANTHROPIC_API_KEY: z.string().min(1).optional(),

    // pdf.ai
    PDF_AI_API_KEY: z.string().min(1).optional(),
    PDF_AI_BASE_URL: z.string().url().optional().default("https://api.pdf.ai"),

    // Cloudflare R2 (S3-compatible document storage)
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_ENDPOINT: z.string().url().optional(),
    R2_BUCKET_CASES: z.string().min(1).default("gett-cases"),
    R2_BUCKET_LEGAL_CORPUS: z.string().min(1).default("legalcorpus"),
    R2_PUBLIC_URL: z.string().url().optional(),

    // Chat SDK (Slack scaffold)
    SLACK_BOT_TOKEN: z.string().min(1).optional(),
    SLACK_SIGNING_SECRET: z.string().min(1).optional(),
    CHAT_WEBHOOK_SECRET: z.string().min(1).optional(),

    // Intake / Handoff
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
    HANDOFF_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(20),
    SITE_URL: z.string().url().default("https://gett.md"),

    // Feature flags
    ALLOW_PHI_PROCESSING: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
    ALLOW_AI_PROCESSING: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
  },

  client: {
    // Persona flags — default off; enable per-persona as each is production-ready.
    // lawgroup is always on (the wedge). All others default to false.
    NEXT_PUBLIC_ENABLE_EMPLOYEE_PERSONA: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
    NEXT_PUBLIC_ENABLE_EMPLOYER_PERSONA: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
    NEXT_PUBLIC_ENABLE_INSURER_PERSONA: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
    // Examination agent is a stub — gates the "Document exam" button in case detail.
    NEXT_PUBLIC_ENABLE_EXAMINATION_AGENT: z
      .string()
      .transform((v) => v === "true" || v === "1")
      .default("false"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID,
    KINDE_CLIENT_SECRET: process.env.KINDE_CLIENT_SECRET,
    KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL,
    KINDE_SITE_URL: process.env.KINDE_SITE_URL,
    KINDE_POST_LOGOUT_REDIRECT_URL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL,
    KINDE_POST_LOGIN_REDIRECT_URL: process.env.KINDE_POST_LOGIN_REDIRECT_URL,

    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

    PDF_AI_API_KEY: process.env.PDF_AI_API_KEY,
    PDF_AI_BASE_URL: process.env.PDF_AI_BASE_URL,

    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET_CASES: process.env.R2_BUCKET_CASES,
    R2_BUCKET_LEGAL_CORPUS: process.env.R2_BUCKET_LEGAL_CORPUS,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    CHAT_WEBHOOK_SECRET: process.env.CHAT_WEBHOOK_SECRET,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    HANDOFF_TOKEN_TTL_MINUTES: process.env.HANDOFF_TOKEN_TTL_MINUTES,
    SITE_URL: process.env.SITE_URL,
    ALLOW_PHI_PROCESSING: process.env.ALLOW_PHI_PROCESSING,
    ALLOW_AI_PROCESSING: process.env.ALLOW_AI_PROCESSING,

    NEXT_PUBLIC_ENABLE_EMPLOYEE_PERSONA: process.env.NEXT_PUBLIC_ENABLE_EMPLOYEE_PERSONA,
    NEXT_PUBLIC_ENABLE_EMPLOYER_PERSONA: process.env.NEXT_PUBLIC_ENABLE_EMPLOYER_PERSONA,
    NEXT_PUBLIC_ENABLE_INSURER_PERSONA: process.env.NEXT_PUBLIC_ENABLE_INSURER_PERSONA,
    NEXT_PUBLIC_ENABLE_EXAMINATION_AGENT: process.env.NEXT_PUBLIC_ENABLE_EXAMINATION_AGENT,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
