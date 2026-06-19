"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Timer } from "@phosphor-icons/react";

interface VerifyGateProps {
  loginUrl: string;
  minutesRemaining: number;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VerifyGate({ loginUrl, minutesRemaining }: VerifyGateProps) {
  const [secondsLeft, setSecondsLeft] = useState(minutesRemaining * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const expired = secondsLeft <= 0;
  const urgent = secondsLeft > 0 && secondsLeft < 120;

  return (
    <div
      style={{
        backgroundColor: "#0e0d0c",
        minHeight: "100svh",
        color: "#ede5d0",
      }}
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      {/* Subtle radial glow behind content */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,154,63,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Shield icon */}
      <div
        className="mb-6"
        style={{ color: "#c89a3f" }}
      >
        <ShieldCheck size={36} weight="light" />
      </div>

      {/* Eyebrow label */}
      <p
        className="font-[family-name:var(--font-heading)] mb-2 text-[10px] font-semibold uppercase"
        style={{ color: "#5a5550", letterSpacing: "0.3em" }}
      >
        Secure upload
      </p>

      {/* Wordmark */}
      <h1
        className="font-[family-name:var(--font-heading)] mb-8 text-[2.75rem] font-bold leading-none tracking-tight"
        style={{ color: "#ede5d0" }}
      >
        gett
      </h1>

      {/* Thin rule */}
      <div
        className="mb-8 h-px w-12"
        style={{ backgroundColor: "#2a2825" }}
      />

      {/* Copy */}
      <div className="mb-8 max-w-[17rem] space-y-3 text-center">
        <p
          className="font-[family-name:var(--font-heading)] text-[1.0625rem] leading-snug"
          style={{ color: "#ede5d0" }}
        >
          Verify your identity to upload documents securely.
        </p>
        <p
          className="text-[0.8125rem] leading-relaxed"
          style={{ color: "#6a6358" }}
        >
          Your lawyer requested this. Nothing is stored until you sign in.
        </p>
      </div>

      {/* Countdown */}
      <div
        className="mb-8 flex items-center gap-1.5 font-mono text-[0.75rem]"
        style={{ color: urgent ? "#c0392b" : expired ? "#c0392b" : "#4a4642" }}
      >
        <Timer size={12} />
        <span>
          {expired
            ? "Link expired"
            : `Expires in ${formatCountdown(secondsLeft)}`}
        </span>
      </div>

      {/* CTA */}
      {!expired ? (
        <a
          href={loginUrl}
          className="group relative block overflow-hidden px-10 py-3.5 text-[0.8125rem] font-semibold transition-all duration-200"
          style={{
            backgroundColor: "#c89a3f",
            color: "#0e0d0c",
            letterSpacing: "0.06em",
          }}
        >
          <span className="relative z-10">Continue securely →</span>
          {/* Hover shimmer */}
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-full"
          />
        </a>
      ) : (
        <p
          className="text-center text-[0.8125rem] leading-relaxed"
          style={{ color: "#6a6358" }}
        >
          This link has expired.
          <br />
          Contact your lawyer to request a new one.
        </p>
      )}

      {/* Footer */}
      <p
        className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px]"
        style={{ color: "#2a2825" }}
      >
        End-to-end encrypted · gett.md
      </p>
    </div>
  );
}
