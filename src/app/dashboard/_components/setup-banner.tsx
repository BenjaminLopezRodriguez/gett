"use client";

import { api } from "@/trpc/react";

interface IntegrationMeta {
  label: string;
  enables: string;
  severity: "critical" | "optional";
}

const INTEGRATION_META: Record<string, IntegrationMeta> = {
  twilio:    { label: "Twilio",           enables: "SMS handoff — clients can't receive upload links",  severity: "critical" },
  anthropic: { label: "Anthropic / Claude", enables: "AI agents — intake, summary, and examination are stubs", severity: "critical" },
  r2:        { label: "Cloudflare R2",    enables: "File storage — document uploads won't persist",     severity: "critical" },
  pdfAi:     { label: "PDF.ai",           enables: "PDF extraction — text won't be parsed from uploads", severity: "optional" },
  slack:     { label: "Slack",            enables: "Chat notifications — not required for core flow",    severity: "optional" },
  kinde:     { label: "Kinde Auth",       enables: "Authentication — required for all user flows",       severity: "critical" },
};

export function SetupBanner() {
  const { data: status } = api.user.getSetupStatus.useQuery();
  if (!status) return null;

  const missing = Object.entries(status).filter(([, s]) => !s.configured);
  if (missing.length === 0) return null;

  const critical = missing.filter(([key]) => INTEGRATION_META[key]?.severity === "critical");
  const optional = missing.filter(([key]) => INTEGRATION_META[key]?.severity === "optional");

  return (
    <div className="gett-setup-banner">
      {critical.length > 0 && (
        <div className="gett-setup-section">
          <p className="gett-setup-heading gett-setup-critical-head">
            ⚠ Not configured — core features are disabled
          </p>
          <ul className="gett-setup-list">
            {critical.map(([key, s]) => {
              const meta = INTEGRATION_META[key];
              return (
                <li key={key} className="gett-setup-item">
                  <span className="gett-setup-label">{meta?.label ?? key}</span>
                  <span className="gett-setup-enables">{meta?.enables}</span>
                  {s.missingVars.length > 0 && (
                    <span className="gett-setup-vars">{s.missingVars.join(", ")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {optional.length > 0 && (
        <div className="gett-setup-section" style={{ marginTop: critical.length ? "0.75rem" : 0 }}>
          <p className="gett-setup-heading">Optional integrations</p>
          <ul className="gett-setup-list">
            {optional.map(([key, s]) => {
              const meta = INTEGRATION_META[key];
              return (
                <li key={key} className="gett-setup-item">
                  <span className="gett-setup-label">{meta?.label ?? key}</span>
                  <span className="gett-setup-enables">{meta?.enables}</span>
                  {s.missingVars.length > 0 && (
                    <span className="gett-setup-vars">{s.missingVars.join(", ")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <style>{`
        .gett-setup-banner {
          margin-bottom: 1.25rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border: 1.5px solid #FCA5A5;
          background: #FFF7F7;
          font-size: 0.8125rem;
          line-height: 1.5;
        }
        .gett-setup-section { }
        .gett-setup-heading {
          margin: 0 0 0.5rem;
          font-weight: 600;
          font-size: 0.8125rem;
          color: #374151;
        }
        .gett-setup-critical-head { color: #B91C1C; }
        .gett-setup-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .gett-setup-item {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.35rem;
          color: #6B7280;
        }
        .gett-setup-label {
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }
        .gett-setup-enables {
          color: #6B7280;
        }
        .gett-setup-enables::before { content: "· "; }
        .gett-setup-vars {
          font-family: monospace;
          font-size: 0.75rem;
          color: #9CA3AF;
          background: #F3F4F6;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .gett-setup-vars::before { content: "env: "; }
      `}</style>
    </div>
  );
}
