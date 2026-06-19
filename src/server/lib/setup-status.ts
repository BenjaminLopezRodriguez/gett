import "server-only";

import { env } from "@/env";
import type { UserPersona } from "@/server/db/schema";

export type IntegrationKey =
  | "kinde"
  | "anthropic"
  | "twilio"
  | "pdfAi"
  | "r2"
  | "slack";

export type IntegrationStatus = Record<
  IntegrationKey,
  { configured: boolean; missingVars: string[] }
>;

export function getIntegrationStatus(): IntegrationStatus {
  const kindeConfigured = !!(
    env.KINDE_CLIENT_ID &&
    env.KINDE_CLIENT_SECRET &&
    env.KINDE_ISSUER_URL
  );
  const anthropicConfigured = !!env.ANTHROPIC_API_KEY;
  const twilioConfigured = !!(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_PHONE_NUMBER
  );
  const pdfAiConfigured = !!env.PDF_AI_API_KEY;
  const r2Configured = !!(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY
  );
  const slackConfigured = !!(
    env.SLACK_BOT_TOKEN && env.SLACK_SIGNING_SECRET
  );

  return {
    kinde: {
      configured: kindeConfigured,
      missingVars: [
        !env.KINDE_CLIENT_ID && "KINDE_CLIENT_ID",
        !env.KINDE_CLIENT_SECRET && "KINDE_CLIENT_SECRET",
        !env.KINDE_ISSUER_URL && "KINDE_ISSUER_URL",
      ].filter(Boolean) as string[],
    },
    anthropic: {
      configured: anthropicConfigured,
      missingVars: !anthropicConfigured ? ["ANTHROPIC_API_KEY"] : [],
    },
    twilio: {
      configured: twilioConfigured,
      missingVars: [
        !env.TWILIO_ACCOUNT_SID && "TWILIO_ACCOUNT_SID",
        !env.TWILIO_AUTH_TOKEN && "TWILIO_AUTH_TOKEN",
        !env.TWILIO_PHONE_NUMBER && "TWILIO_PHONE_NUMBER",
      ].filter(Boolean) as string[],
    },
    pdfAi: {
      configured: pdfAiConfigured,
      missingVars: !pdfAiConfigured ? ["PDF_AI_API_KEY"] : [],
    },
    r2: {
      configured: r2Configured,
      missingVars: [
        !env.R2_ACCOUNT_ID && "R2_ACCOUNT_ID",
        !env.R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
        !env.R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
      ].filter(Boolean) as string[],
    },
    slack: {
      configured: slackConfigured,
      missingVars: [
        !env.SLACK_BOT_TOKEN && "SLACK_BOT_TOKEN",
        !env.SLACK_SIGNING_SECRET && "SLACK_SIGNING_SECRET",
      ].filter(Boolean) as string[],
    },
  };
}

const VERIFICATION_ENV: Record<UserPersona, string[]> = {
  employee: ["EMPLOYER_VERIFICATION_API_KEY"],
  employer: ["ORG_VERIFICATION_API_KEY"],
  lawgroup: ["BAR_VERIFICATION_API_KEY"],
  insurer: ["NAIC_VERIFICATION_API_KEY"],
};

export function getVerificationStatus(persona: UserPersona) {
  const requiredVars = VERIFICATION_ENV[persona];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  return {
    configured: missingVars.length === 0,
    missingVars,
  };
}
