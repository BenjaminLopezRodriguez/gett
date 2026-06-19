"use client";

import {
  Buildings,
  Scales,
  Shield,
  User,
  type IconProps,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type VerificationFields = Record<string, string>;

export function OnboardingFlow({
  userEmail,
  initialStep = 1,
  initialPersona = null,
  verifyOnly = false,
}: {
  userEmail: string;
  initialStep?: 1 | 2;
  initialPersona?: UserPersona | null;
  verifyOnly?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [persona, setPersona] = useState<UserPersona | null>(initialPersona);
  const [fields, setFields] = useState<VerificationFields>({});

  const completeOnboarding = api.user.completeOnboarding.useMutation({
    onSuccess: (data) => {
      router.push(data.redirectPath);
    },
  });

  const submitVerification = api.user.submitVerification.useMutation({
    onSuccess: () => {
      if (persona) {
        router.push(getDashboardPath(persona));
      }
    },
  });

  useEffect(() => {
    if (initialPersona) {
      setPersona(initialPersona);
    }
    setStep(initialStep);
  }, [initialStep, initialPersona]);

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
    completeOnboarding.mutate({
      persona,
      verificationPayload: fields,
    });
  }

  function handleSkip() {
    if (!persona || verifyOnly) return;
    completeOnboarding.mutate({
      persona,
      skipVerification: true,
    });
  }

  const config = persona ? VERIFICATION_CONFIG[persona] : null;
  const isPending =
    completeOnboarding.isPending || submitVerification.isPending;

  return (
    <div className="gett-onboarding">
      <header className="gett-onb-header">
        <span className="gett-onb-logo">gett</span>
        <span className="gett-onb-email">{userEmail}</span>
      </header>

      <main className="gett-onb-main">
        <div className="gett-onb-card">
          {!verifyOnly && <p className="gett-onb-step">Step {step} of 2</p>}

          {step === 1 && !verifyOnly && (
            <>
              <h1 className="gett-onb-title">I am&hellip;</h1>
              <p className="gett-onb-desc">
                Choose your role to personalize your gett experience.
              </p>
              <div className="gett-onb-grid">
                {PERSONA_OPTIONS.map(({ persona: p, label, desc, Icon }) => (
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
            </>
          )}

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
                  {isPending ? "Setting up…" : "Verify"}
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
        .gett-onb-field input {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          font-size: 0.875rem;
          outline: none;
        }
        .gett-onb-field input:focus { border-color: var(--blue); }
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
        .gett-onb-continue:disabled { opacity: 0.6; }
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
      `}</style>
    </div>
  );
}
