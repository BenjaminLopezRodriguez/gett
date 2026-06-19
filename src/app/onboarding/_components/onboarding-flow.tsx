"use client";

import {
  Buildings,
  Scales,
  Shield,
  User,
  UploadSimple,
  File,
  type IconProps,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import { env } from "@/env";
import { VERIFICATION_CONFIG } from "@/lib/verification-config";
import type { UserPersona } from "@/server/db/schema";
import { getDashboardPath } from "@/server/lib/persona";
import { api } from "@/trpc/react";

type AnyIcon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

const PERSONA_OPTIONS: {
  persona: UserPersona;
  label: string;
  desc: string;
  Icon: AnyIcon;
}[] = [
  {
    persona: "employee",
    label: "I'm an employee",
    desc: "Help me with benefits, leave, or paperwork",
    Icon: User,
  },
  {
    persona: "employer",
    label: "I'm an employer / HR",
    desc: "Improve compliance and reduce admin overhead",
    Icon: Buildings,
  },
  {
    persona: "lawgroup",
    label: "I'm with a law group",
    desc: "Grow my disability or workers' comp practice",
    Icon: Scales,
  },
  {
    persona: "insurer",
    label: "I'm an insurer",
    desc: "Streamline claims and reduce friction",
    Icon: Shield,
  },
];

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
] as const;

type VerificationFields = Record<string, string>;

export function OnboardingFlow({
  userEmail,
  initialStep = 1,
  initialPersona = null,
  verifyOnly = false,
}: {
  userEmail: string;
  initialStep?: 1 | 2 | 3;
  initialPersona?: UserPersona | null;
  verifyOnly?: boolean;
}) {
  const router = useRouter();
  const handbookRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [persona, setPersona] = useState<UserPersona | null>(initialPersona);
  const [fields, setFields] = useState<VerificationFields>({});
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Step 3 (employer org details) state
  const [orgState, setOrgState] = useState("");
  const [isUnionized, setIsUnionized] = useState<boolean | null>(null);
  const [unionName, setUnionName] = useState("");
  const [handbookFile, setHandbookFile] = useState<File | null>(null);

  const completeOnboarding = api.user.completeOnboarding.useMutation({
    onSuccess: (data) => {
      if (persona === "employer") {
        setPendingRedirect(data.redirectPath);
        setStep(3);
      } else {
        router.push(data.redirectPath);
      }
    },
  });

  const submitVerification = api.user.submitVerification.useMutation({
    onSuccess: () => {
      if (persona) router.push(getDashboardPath(persona));
    },
  });

  const saveEmployerSetup = api.user.saveEmployerSetup.useMutation({
    onSuccess: () => {
      if (pendingRedirect) router.push(pendingRedirect);
    },
  });

  function handlePersonaSelect(p: UserPersona) {
    setPersona(p);
    setFields({});
    setStep(2);
  }

  function handleVerify() {
    if (!persona) return;
    if (verifyOnly) {
      submitVerification.mutate({ payload: fields });
      return;
    }
    completeOnboarding.mutate({ persona, verificationPayload: fields });
  }

  function handleSkip() {
    if (!persona || verifyOnly) return;
    completeOnboarding.mutate({ persona, skipVerification: true });
  }

  async function handleOrgSubmit() {
    if (!orgState || isUnionized === null) return;

    let handbookBase64: string | undefined;
    let handbookFilename: string | undefined;

    if (handbookFile) {
      const buf = await handbookFile.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      handbookBase64 = btoa(bin);
      handbookFilename = handbookFile.name;
    }

    saveEmployerSetup.mutate({
      state: orgState,
      isUnionized,
      unionName: isUnionized && unionName ? unionName : undefined,
      handbookBase64,
      handbookFilename,
    });
  }

  function handleOrgSkip() {
    if (pendingRedirect) router.push(pendingRedirect);
  }

  const config = persona ? VERIFICATION_CONFIG[persona] : null;
  const totalSteps = persona === "employer" ? 3 : 2;
  const isPending =
    completeOnboarding.isPending ||
    submitVerification.isPending ||
    saveEmployerSetup.isPending;

  const orgContinueDisabled = isPending || !orgState || isUnionized === null;

  return (
    <div className="gett-onboarding">
      <header className="gett-onb-header">
        <span className="gett-onb-logo">gett</span>
        <span className="gett-onb-email">{userEmail}</span>
      </header>

      <main className="gett-onb-main">
        <div className="gett-onb-card">
          {!verifyOnly && <p className="gett-onb-step">Step {step} of {totalSteps}</p>}

          {/* ── Step 1: Persona selection ── */}
          {step === 1 && !verifyOnly && (
            <>
              <h1 className="gett-onb-title">I am&hellip;</h1>
              <p className="gett-onb-desc">
                Choose your role to personalize your gett experience.
              </p>
              <div className="gett-onb-grid">
                {PERSONA_OPTIONS.filter(({ persona: p }) => {
                  if (p === "employee") return env.NEXT_PUBLIC_ENABLE_EMPLOYEE_PERSONA;
                  if (p === "employer") return env.NEXT_PUBLIC_ENABLE_EMPLOYER_PERSONA;
                  if (p === "insurer") return env.NEXT_PUBLIC_ENABLE_INSURER_PERSONA;
                  return true; // lawgroup always shown
                }).map(({ persona: p, label, desc, Icon }) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePersonaSelect(p)}
                    className="gett-onb-option"
                  >
                    <div className="gett-onb-icon">
                      <Icon size={22} weight="regular" />
                    </div>
                    <p className="gett-onb-opt-label">{label}</p>
                    <p className="gett-onb-opt-desc">{desc}</p>
                  </button>
                ))}
              </div>
              <p className="gett-onb-waitlist-hint">
                Not a law group?{" "}
                <Link href="/waitlist" className="gett-onb-waitlist-link">
                  Join the waitlist →
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: Verification ── */}
          {step === 2 && persona && config && (
            <>
              {!verifyOnly && (
                <button
                  type="button"
                  className="gett-onb-back"
                  onClick={() => setStep(1)}
                >
                  &larr; Back
                </button>
              )}
              <h1 className="gett-onb-title">{config.title}</h1>
              <p className="gett-onb-desc">{config.description}</p>

              <div className="gett-onb-benefits">
                <strong>Verify now for full access</strong>
                <span>{config.benefits}</span>
              </div>

              <p className="gett-onb-passive">
                You can skip this step and still use gett — verification unlocks
                additional features when you&apos;re ready.
              </p>

              <div className="gett-onb-fields">
                {config.fields.map((field) => (
                  <label key={field.key} className="gett-onb-field">
                    <span>{field.label}</span>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={fields[field.key] ?? ""}
                      onChange={(e) =>
                        setFields((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="gett-onb-actions">
                <button
                  type="button"
                  className="gett-onb-continue"
                  disabled={isPending}
                  onClick={handleVerify}
                >
                  {isPending ? "Setting up…" : persona === "employer" ? "Continue →" : "Verify"}
                </button>
                {!verifyOnly && (
                  <button
                    type="button"
                    className="gett-onb-skip"
                    disabled={isPending}
                    onClick={handleSkip}
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: Employer org details ── */}
          {step === 3 && persona === "employer" && (
            <>
              <button
                type="button"
                className="gett-onb-back"
                onClick={() => setStep(2)}
              >
                &larr; Back
              </button>
              <h1 className="gett-onb-title">Organization details</h1>
              <p className="gett-onb-desc">
                A few more details to tailor your compliance workspace.
              </p>

              <div className="gett-onb-fields">
                {/* State */}
                <label className="gett-onb-field">
                  <span>State</span>
                  <select
                    value={orgState}
                    onChange={(e) => setOrgState(e.target.value)}
                    className="gett-onb-select"
                  >
                    <option value="">Select your state…</option>
                    {US_STATES.map(({ code, name }) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </label>

                {/* Union status */}
                <div className="gett-onb-field">
                  <span>Is this division unionized?</span>
                  <div className="gett-onb-toggle-row">
                    <button
                      type="button"
                      onClick={() => setIsUnionized(true)}
                      className={`gett-onb-toggle ${isUnionized === true ? "gett-onb-toggle--active" : ""}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUnionized(false)}
                      className={`gett-onb-toggle ${isUnionized === false ? "gett-onb-toggle--active" : ""}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Union name (conditional) */}
                {isUnionized === true && (
                  <label className="gett-onb-field">
                    <span>Which union? <em className="gett-onb-optional">(optional)</em></span>
                    <input
                      type="text"
                      placeholder="e.g. SEIU, Teamsters, UAW"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                    />
                  </label>
                )}

                {/* Handbook upload */}
                <div className="gett-onb-field">
                  <span>Employee handbook <em className="gett-onb-optional">(optional)</em></span>
                  {handbookFile ? (
                    <div className="gett-onb-file-preview">
                      <File size={16} weight="regular" />
                      <span className="gett-onb-file-name">{handbookFile.name}</span>
                      <button
                        type="button"
                        className="gett-onb-file-remove"
                        onClick={() => {
                          setHandbookFile(null);
                          if (handbookRef.current) handbookRef.current.value = "";
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="gett-onb-upload-btn"
                      onClick={() => handbookRef.current?.click()}
                    >
                      <UploadSimple size={15} weight="regular" />
                      Upload PDF
                    </button>
                  )}
                  <input
                    ref={handbookRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setHandbookFile(f);
                    }}
                  />
                </div>
              </div>

              <div className="gett-onb-actions">
                <button
                  type="button"
                  className="gett-onb-continue"
                  disabled={orgContinueDisabled}
                  onClick={handleOrgSubmit}
                >
                  {isPending ? "Saving…" : "Finish setup"}
                </button>
                <button
                  type="button"
                  className="gett-onb-skip"
                  disabled={isPending}
                  onClick={handleOrgSkip}
                >
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        .gett-onboarding {
          --blue: #3040F5;
          --blue-soft: #EEF0FF;
          --blue-border: #D8DCFF;
          --ink: #08103a;
          --ink-muted: #606898;
          --ink-faint: #9099C8;
          min-height: 100vh;
          background: #F8F9FF;
          color: var(--ink);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
        }
        .gett-onb-header {
          background: var(--blue);
          color: #fff;
          padding: 0 1.5rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gett-onb-logo {
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .gett-onb-email { font-size: 0.875rem; opacity: 0.85; }
        .gett-onb-main {
          max-width: 36rem;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }
        .gett-onb-card {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid var(--blue-border);
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(48,64,245,0.08);
        }
        .gett-onb-step {
          margin: 0 0 0.5rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }
        .gett-onb-title {
          margin: 0;
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .gett-onb-desc {
          margin: 0.5rem 0 1.25rem;
          color: var(--ink-muted);
          font-size: 0.9375rem;
          line-height: 1.55;
        }
        .gett-onb-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 480px) {
          .gett-onb-grid { grid-template-columns: 1fr; }
        }
        .gett-onb-option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1.25rem;
          border: 1.5px solid var(--blue-border);
          border-radius: 14px;
          background: #fff;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
        }
        .gett-onb-option:hover {
          border-color: var(--blue);
          background: var(--blue-soft);
        }
        .gett-onb-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--blue-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          color: var(--blue);
        }
        .gett-onb-opt-label {
          margin: 0 0 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .gett-onb-opt-desc {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--ink-faint);
          line-height: 1.45;
        }
        .gett-onb-back {
          margin-bottom: 1rem;
          border: none;
          background: none;
          color: var(--blue);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }
        .gett-onb-benefits {
          margin-bottom: 1rem;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          font-size: 0.8125rem;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .gett-onb-benefits strong { color: var(--blue); }
        .gett-onb-passive {
          margin: 0 0 1.25rem;
          font-size: 0.8125rem;
          color: var(--ink-faint);
          line-height: 1.5;
        }
        .gett-onb-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .gett-onb-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .gett-onb-field input,
        .gett-onb-select {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          font-size: 0.875rem;
          outline: none;
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          color: var(--ink);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239099C8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.875rem center;
          padding-right: 2.25rem;
        }
        .gett-onb-field input:focus,
        .gett-onb-select:focus { border-color: var(--blue); }
        .gett-onb-optional {
          font-style: normal;
          font-weight: 400;
          color: var(--ink-faint);
        }
        .gett-onb-toggle-row {
          display: flex;
          gap: 0.5rem;
        }
        .gett-onb-toggle {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          color: var(--ink-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.12s, background 0.12s, color 0.12s;
        }
        .gett-onb-toggle--active {
          border-color: var(--blue);
          background: var(--blue);
          color: #fff;
        }
        .gett-onb-upload-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1.5px dashed var(--blue-border);
          background: var(--blue-soft);
          color: var(--blue);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.12s;
        }
        .gett-onb-upload-btn:hover { border-color: var(--blue); }
        .gett-onb-file-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          font-size: 0.875rem;
          color: var(--ink);
        }
        .gett-onb-file-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gett-onb-file-remove {
          border: none;
          background: none;
          color: var(--ink-faint);
          font-size: 1rem;
          cursor: pointer;
          line-height: 1;
          padding: 0 0.125rem;
          flex-shrink: 0;
        }
        .gett-onb-file-remove:hover { color: var(--ink); }
        .gett-onb-actions {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .gett-onb-continue {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 12px;
          background: var(--blue);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
        }
        .gett-onb-continue:disabled { opacity: 0.6; cursor: not-allowed; }
        .gett-onb-skip {
          width: 100%;
          padding: 0.875rem;
          border: 1.5px solid var(--blue-border);
          border-radius: 12px;
          background: #fff;
          color: var(--ink-muted);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
        }
        .gett-onb-skip:disabled { opacity: 0.6; }

        .gett-onb-waitlist-hint {
          margin: 16px 0 0;
          text-align: center;
          font-size: 0.8125rem;
          color: var(--ink-faint);
        }
        .gett-onb-waitlist-link {
          color: #3040F5;
          text-decoration: none;
          font-weight: 500;
        }
        .gett-onb-waitlist-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
