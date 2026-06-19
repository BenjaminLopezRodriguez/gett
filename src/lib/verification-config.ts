import type { UserPersona } from "@/server/db/schema";

export type VerificationField = {
  key: string;
  label: string;
  placeholder: string;
};

export type VerificationConfig = {
  title: string;
  description: string;
  benefits: string;
  bannerMessage: string;
  capabilityHint: string;
  fields: VerificationField[];
};

export const VERIFICATION_CONFIG: Record<UserPersona, VerificationConfig> = {
  employee: {
    title: "Verify your employment",
    description:
      "Optional — confirm your employer to link leave and benefits cases automatically.",
    benefits:
      "Verified employees can share case hashes with HR and counsel, and receive employer-linked updates.",
    bannerMessage:
      "Verify your employment to unlock full case features and employer-linked updates.",
    capabilityHint:
      "You can browse and create cases; verified accounts can share case hashes with counsel.",
    fields: [
      {
        key: "employerDomain",
        label: "Work email domain",
        placeholder: "acme.com",
      },
      {
        key: "employerCode",
        label: "Employer code (optional)",
        placeholder: "ACME-2024",
      },
    ],
  },
  employer: {
    title: "Verify your organization",
    description:
      "Optional — confirm your company to enable compliance tracking and org-wide case visibility.",
    benefits:
      "Verified employers can invite employees, sync leave policies, and export compliance reports.",
    bannerMessage:
      "Verify your organization to unlock org-wide case management and compliance exports.",
    capabilityHint:
      "You can browse and create cases; verified accounts can invite employees and sync policies.",
    fields: [
      { key: "companyName", label: "Company name", placeholder: "Acme Corp" },
      { key: "ein", label: "EIN (placeholder)", placeholder: "12-3456789" },
    ],
  },
  lawgroup: {
    title: "Verify your firm",
    description:
      "Optional — confirm your law firm credentials for client intake and case sharing.",
    benefits:
      "Verified firms can receive client referrals, share case hashes with insurers, and access intake automation.",
    bannerMessage:
      "Verify your firm to unlock client intake automation and case sharing with insurers.",
    capabilityHint:
      "You can browse and create cases; verified accounts can share case hashes with counsel.",
    fields: [
      {
        key: "firmName",
        label: "Firm name",
        placeholder: "Smith & Associates",
      },
      { key: "barNumber", label: "Bar number", placeholder: "CA-123456" },
    ],
  },
  insurer: {
    title: "Verify your carrier",
    description:
      "Optional — confirm your insurance carrier for claims processing and adjudication workflows.",
    benefits:
      "Verified carriers can receive complete claim submissions and connect with law firms on shared cases.",
    bannerMessage:
      "Verify your carrier to unlock full claims processing and firm collaboration features.",
    capabilityHint:
      "You can browse and create cases; verified accounts can receive submissions from law firms.",
    fields: [
      {
        key: "carrierName",
        label: "Carrier name",
        placeholder: "National Insurance Co.",
      },
      { key: "naicCode", label: "NAIC code", placeholder: "12345" },
    ],
  },
};
