"use client";

import { useState } from "react";
import Link from "next/link";

import { VERIFICATION_CONFIG } from "@/lib/verification-config";
import type { UserPersona } from "@/server/db/schema";
import { api } from "@/trpc/react";

type VerificationFields = Record<string, string>;

export function VerificationBanner({ persona }: { persona: UserPersona }) {
  const utils = api.useUtils();
  const profileQuery = api.user.getProfile.useQuery();
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<VerificationFields>({});

  const submitVerification = api.user.submitVerification.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
      setExpanded(false);
      setFields({});
    },
  });

  const status = profileQuery.data?.verificationStatus;
  const config = VERIFICATION_CONFIG[persona];

  if (!status || status === "verified") return null;

  if (status === "pending") {
    return (
      <div className="gett-verify-banner gett-verify-banner-pending">
        <p className="gett-verify-title">Verification in progress</p>
        <p className="gett-verify-desc">
          We&apos;re reviewing your {config.title.toLowerCase().replace("verify your ", "")}{" "}
          details. You can continue using gett while we process your submission.
        </p>
        <VerificationBannerStyles />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitVerification.mutate({ payload: fields });
  }

  return (
    <div className="gett-verify-banner">
      <div className="gett-verify-header">
        <div>
          <p className="gett-verify-title">Verification recommended</p>
          <p className="gett-verify-desc">{config.bannerMessage}</p>
          <p className="gett-verify-hint">{config.capabilityHint}</p>
        </div>
        {!expanded && (
          <div className="gett-verify-actions">
            <button
              type="button"
              className="gett-verify-btn-primary"
              onClick={() => setExpanded(true)}
            >
              Verify now
            </button>
            <Link href="/onboarding?step=verify" className="gett-verify-link">
              Open full form
            </Link>
          </div>
        )}
      </div>

      {expanded && (
        <form className="gett-verify-form" onSubmit={handleSubmit}>
          <p className="gett-verify-form-desc">{config.benefits}</p>
          {config.fields.map((field) => (
            <label key={field.key} className="gett-verify-field">
              <span>{field.label}</span>
              <input
                type="text"
                placeholder={field.placeholder}
                value={fields[field.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </label>
          ))}
          <div className="gett-verify-form-actions">
            <button
              type="submit"
              className="gett-verify-btn-primary"
              disabled={submitVerification.isPending}
            >
              {submitVerification.isPending ? "Submitting…" : "Submit verification"}
            </button>
            <button
              type="button"
              className="gett-verify-btn-ghost"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <VerificationBannerStyles />
    </div>
  );
}

function VerificationBannerStyles() {
  return (
    <style>{`
      .gett-verify-banner {
        margin-bottom: 1rem;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        border: 1.5px solid #F59E0B;
        background: #FFFBEB;
        color: #92400E;
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .gett-verify-banner-pending {
        border-color: #93C5FD;
        background: #EFF6FF;
        color: #1E40AF;
      }
      .gett-verify-header {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .gett-verify-title {
        margin: 0 0 0.375rem;
        font-weight: 600;
      }
      .gett-verify-desc {
        margin: 0;
      }
      .gett-verify-hint {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        opacity: 0.85;
      }
      .gett-verify-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.375rem;
        flex-shrink: 0;
      }
      .gett-verify-btn-primary {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        background: #D97706;
        color: #fff;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
      }
      .gett-verify-btn-primary:disabled { opacity: 0.6; }
      .gett-verify-btn-ghost {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #92400E;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
      }
      .gett-verify-link {
        font-size: 0.75rem;
        color: #92400E;
        opacity: 0.85;
      }
      .gett-verify-form {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(146, 64, 14, 0.2);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .gett-verify-form-desc {
        margin: 0;
        font-size: 0.8125rem;
      }
      .gett-verify-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .gett-verify-field input {
        padding: 0.625rem 0.875rem;
        border-radius: 8px;
        border: 1.5px solid #FCD34D;
        background: #fff;
        font-size: 0.875rem;
        outline: none;
      }
      .gett-verify-field input:focus { border-color: #D97706; }
      .gett-verify-form-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }
    `}</style>
  );
}
