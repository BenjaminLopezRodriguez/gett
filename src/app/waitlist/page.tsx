"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const SEGMENT_META: Record<string, { headline: string; sub: string; label: string }> = {
  employees: {
    label: "employees",
    headline: "Built for you — almost ready.",
    sub: "gett is finalising tools to help employees navigate medical leave, disability filing, and accommodation requests. Leave your email and you'll be first to know.",
  },
  employers: {
    label: "employers and HR teams",
    headline: "HR compliance tools are coming.",
    sub: "gett is building FMLA, ADA, and state leave compliance features for HR teams. Leave your email and we'll reach out when it's ready.",
  },
  insurers: {
    label: "insurers",
    headline: "Claims tools are on the way.",
    sub: "gett is building a streamlined claims workspace for insurers and adjusters. Leave your email and we'll notify you at launch.",
  },
  clinicians: {
    label: "clinicians and HCPs",
    headline: "A clinician portal is in progress.",
    sub: "gett is building a dedicated portal for treating physicians and HCPs to receive documentation requests and submit forms securely via text link.",
  },
  therapists: {
    label: "therapists and telehealth providers",
    headline: "Telehealth tools are coming.",
    sub: "gett is building encrypted video sessions and a therapist marketplace. Leave your email and we'll reach out when it launches.",
  },
};

const DEFAULT_META = {
  label: "you",
  headline: "We're building this for you.",
  sub: "gett is expanding beyond law groups. Leave your email and we'll reach out when your role is supported.",
};

export default function WaitlistPage() {
  const searchParams = useSearchParams();
  const forParam = searchParams.get("for") ?? "";
  const meta = SEGMENT_META[forParam] ?? DEFAULT_META;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, segment: forParam || "general" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{
      minHeight: "100svh",
      background: "#fafafa",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Nav */}
      <nav style={{
        height: "56px",
        borderBottom: "1px solid #E8EBF0",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
      }}>
        <Link href="/" style={{
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "20px",
          fontWeight: 700,
          color: "#0D1B2A",
          textDecoration: "none",
          letterSpacing: "-0.03em",
        }}>
          gett
        </Link>
        <span style={{ width: "1px", height: "16px", background: "#E0E4FF" }} />
        <Link href="/" style={{
          fontSize: "13px",
          color: "#6B7280",
          textDecoration: "none",
        }}>
          ← Back
        </Link>
      </nav>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Badge */}
          <p style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#3040F5",
            background: "#EEF0FF",
            padding: "4px 10px",
            borderRadius: "99px",
            marginBottom: "20px",
          }}>
            Coming soon for {meta.label}
          </p>

          <h1 style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "clamp(26px, 5vw, 36px)",
            fontWeight: 700,
            color: "#0D1B2A",
            lineHeight: 1.2,
            letterSpacing: "-0.025em",
            margin: "0 0 14px",
          }}>
            {meta.headline}
          </h1>

          <p style={{
            fontSize: "15px",
            color: "#6B7280",
            lineHeight: 1.65,
            margin: "0 0 32px",
          }}>
            {meta.sub}
          </p>

          {status === "done" ? (
            <div style={{
              padding: "20px 24px",
              borderRadius: "14px",
              background: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
              color: "#15803D",
              fontSize: "15px",
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              You&apos;re on the list. We&apos;ll be in touch.
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "1.5px solid #E0E4FF",
                  fontSize: "15px",
                  outline: "none",
                  color: "#0D1B2A",
                  background: "#fff",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3040F5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E0E4FF")}
              />
              {status === "error" && (
                <p style={{ margin: 0, fontSize: "13px", color: "#DC2626" }}>
                  Something went wrong — please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  padding: "13px 20px",
                  borderRadius: "12px",
                  background: "#3040F5",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  border: "none",
                  cursor: status === "loading" ? "default" : "pointer",
                  opacity: status === "loading" ? 0.6 : 1,
                  transition: "opacity 0.15s, background 0.15s",
                  letterSpacing: "-0.012em",
                }}
                onMouseEnter={(e) => { if (status !== "loading") e.currentTarget.style.background = "#1e2fd4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = status === "loading" ? "#3040F5" : "#3040F5"; }}
              >
                {status === "loading" ? "Saving…" : "Notify me when it's ready"}
              </button>
            </form>
          )}

          <p style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#9CA3AF",
            textAlign: "center",
          }}>
            Already have an account?{" "}
            <Link href="/api/auth/login" style={{ color: "#3040F5", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
