"use client";

import { api } from "@/trpc/react";

const INTEGRATION_LABELS: Record<string, string> = {
  kinde: "Kinde Auth",
  anthropic: "Anthropic / Claude",
  pdfAi: "PDF.ai",
  r2: "Cloudflare R2",
  slack: "Slack",
};

export function SetupBanner() {
  const { data: status } = api.user.getSetupStatus.useQuery();

  if (!status) return null;

  const missing = Object.entries(status).filter(([, s]) => !s.configured);
  if (missing.length === 0) return null;

  return (
    <div className="gett-setup-banner">
      <p className="gett-setup-title">Some integrations are not configured</p>
      <ul className="gett-setup-list">
        {missing.map(([key, s]) => (
          <li key={key}>
            <span className="gett-setup-missing">{INTEGRATION_LABELS[key] ?? key}</span>
            {s.missingVars.length > 0 && (
              <span className="gett-setup-vars">
                {" "}
                — missing: {s.missingVars.join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>
      <style>{`
        .gett-setup-banner {
          margin-bottom: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border: 1.5px solid #CBD5E1;
          background: #F8FAFC;
          color: #475569;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .gett-setup-title {
          margin: 0 0 0.5rem;
          font-weight: 600;
        }
        .gett-setup-list {
          margin: 0;
          padding-left: 1.25rem;
        }
        .gett-setup-missing { font-weight: 600; }
        .gett-setup-vars { font-weight: 400; opacity: 0.85; }
      `}</style>
    </div>
  );
}
