"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { PERSONA_LABELS } from "@/server/lib/persona";
import type { UserPersona } from "@/server/db/schema";

import { SetupBanner } from "./setup-banner";
import { VerificationBanner } from "./verification-banner";

export function DashboardShell({
  persona,
  userEmail,
  children,
}: {
  persona: UserPersona;
  userEmail: string;
  children: ReactNode;
}) {
  return (
    <div className="gett-dashboard">
      <header className="gett-dash-header">
        <div className="gett-dash-header-inner">
          <Link href="/" className="gett-dash-logo">
            gett
          </Link>
          <div className="gett-dash-meta">
            <span className="gett-dash-persona">{PERSONA_LABELS[persona]}</span>
            <span className="gett-dash-email">{userEmail}</span>
            <Link href="/api/auth/logout" className="gett-dash-signout">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="gett-dash-main">
        <VerificationBanner persona={persona} />
        <SetupBanner />
        {children}
      </main>

      <style>{`
        .gett-dashboard {
          --blue: #3040F5;
          --blue-soft: #EEF0FF;
          --blue-border: #D8DCFF;
          --ink: #08103a;
          --ink-muted: #606898;
          --ink-faint: #9099C8;
          min-height: 100vh;
          background: #fff;
          color: var(--ink);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
        }
        .gett-dash-header {
          background: var(--blue);
          color: #fff;
        }
        .gett-dash-header-inner {
          max-width: 64rem;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .gett-dash-logo {
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #fff;
          text-decoration: none;
        }
        .gett-dash-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }
        .gett-dash-persona {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          font-weight: 500;
        }
        .gett-dash-email { opacity: 0.85; }
        .gett-dash-signout {
          color: #fff;
          opacity: 0.85;
          text-decoration: none;
        }
        .gett-dash-signout:hover { opacity: 1; }
        .gett-dash-main {
          max-width: 64rem;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }
        .gett-dash-title {
          margin: 0;
          font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
          font-size: 1.875rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .gett-dash-subtitle {
          margin: 0.5rem 0 2rem;
          color: var(--ink-muted);
          font-size: 1rem;
          line-height: 1.6;
          max-width: 36rem;
        }
        .gett-muted { color: var(--ink-muted); font-size: 0.875rem; }
        .gett-case-form {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .gett-input {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--blue-border);
          background: var(--blue-soft);
          font-size: 0.875rem;
          outline: none;
        }
        .gett-input:focus { border-color: var(--blue); }
        .gett-btn-primary {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 10px;
          background: var(--blue);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }
        .gett-btn-primary:disabled { opacity: 0.5; }
        .gett-case-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border: 1.5px solid var(--blue-border);
          border-radius: 14px;
          overflow: hidden;
        }
        .gett-case-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px solid var(--blue-border);
          transition: background 0.15s;
        }
        .gett-case-row:last-child { border-bottom: none; }
        .gett-case-row:hover { background: var(--blue-soft); }
        .gett-case-title {
          margin: 0;
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .gett-case-hash {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--ink-faint);
        }
        .gett-case-status {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: var(--blue-soft);
          color: var(--blue);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
