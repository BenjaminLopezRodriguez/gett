"use client";

import { useState, useEffect } from "react";
import {
  CaretDown,
  ArrowRight,
  ChatText,
  Files,
  ChartBar,
} from "@phosphor-icons/react";

type Seg = "employers" | "lawgroups" | "insurers";

const SEGS: Seg[] = ["employers", "lawgroups", "insurers"];

const LABELS: Record<Seg, string> = {
  employers: "for employers",
  lawgroups: "for law groups",
  insurers: "for insurers",
};

interface Msg {
  d: "in" | "out";
  t: string;
  ts: string;
}

const DATA: Record<
  Seg,
  {
    h1: string;
    h2: string;
    sub: string;
    cta: string;
    contact: string;
    msgs: Msg[];
  }
> = {
  employers: {
    h1: "Settlement.",
    h2: "Handled.",
    sub: "Stop chasing medical providers. gett coordinates your entire settlement process — liens, MSAs, and disbursements — in one transparent system.",
    cta: "Start a claim",
    contact: "Medical Provider",
    msgs: [
      { d: "in", t: "We have a lien on file for $48,200.", ts: "9:14 AM" },
      { d: "out", t: "Ready to settle. Our offer: $31,000.", ts: "9:15 AM" },
      { d: "in", t: "Accepted. Send the release form?", ts: "9:16 AM" },
      { d: "out", t: "Already in gett — check your portal.", ts: "9:16 AM" },
      { d: "in", t: "Got it. Signing by EOD.", ts: "9:18 AM" },
    ],
  },
  lawgroups: {
    h1: "Resolve faster.",
    h2: "Bill better.",
    sub: "From demand letters to final disbursement, gett keeps every case on track and every deadline visible across your entire practice.",
    cta: "Open your practice",
    contact: "Adjuster · State Farm",
    msgs: [
      { d: "in", t: "Counter at $85k on your $120k demand.", ts: "11:31 AM" },
      { d: "out", t: "We counter at $105k. Docs attached.", ts: "11:33 AM" },
      { d: "in", t: "Let me run this by my supervisor.", ts: "11:34 AM" },
      { d: "out", t: "72-hour response window starts now.", ts: "11:35 AM" },
      { d: "in", t: "Agreed. $105k. Releases coming now.", ts: "11:47 AM" },
    ],
  },
  insurers: {
    h1: "Close claims.",
    h2: "Not offices.",
    sub: "Give adjusters the tools to settle without endless back-and-forth. gett replaces fax, email, and phone with one complete audit trail.",
    cta: "See the workflow",
    contact: "Rivera Law Group",
    msgs: [
      { d: "out", t: "Claim #77-B is 14 months open. Status?", ts: "2:05 PM" },
      { d: "in", t: "Medicare approval pending. Filing today.", ts: "2:08 PM" },
      { d: "out", t: "Flagged. Hard 5-day deadline.", ts: "2:09 PM" },
      { d: "in", t: "MSA approved. Ready to close.", ts: "3:41 PM" },
      { d: "out", t: "Payment issued. File closed. ✓", ts: "3:45 PM" },
    ],
  },
};

const STATS = [
  { val: "94%", label: "faster claim resolution" },
  { val: "$2.4B", label: "in settlements processed" },
  { val: "12 days", label: "average time to close" },
];

const FEATURES = [
  {
    Icon: ChatText,
    title: "Unified inbox",
    body: "Every message, document, and status update in one thread. No more hunting across email chains.",
  },
  {
    Icon: Files,
    title: "Document hub",
    body: "Medical records, releases, and MSAs — stored, versioned, and shareable in seconds.",
  },
  {
    Icon: ChartBar,
    title: "Live analytics",
    body: "Track resolution rates, open claims, and bottlenecks across your entire portfolio.",
  },
];

export function LandingPage() {
  const [seg, setSeg] = useState<Seg>("employers");
  const [dropOpen, setDropOpen] = useState(false);
  const [key, setKey] = useState(0);

  const d = DATA[seg];

  function pickSeg(s: Seg) {
    setSeg(s);
    setKey((k) => k + 1);
    setDropOpen(false);
  }

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-dropdown]")) setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [dropOpen]);

  return (
    <div dir="ltr" className="min-h-screen" style={{ background: "#f7f9fc", color: "#0d2540", fontFamily: "var(--font-sans, 'Figtree', sans-serif)" }}>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(247,249,252,0.96)", backdropFilter: "blur(12px)", borderColor: "#ccdaec" }}>
        {/* editorial top-rule */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #0d2540 0%, #2d6096 60%, transparent 100%)" }} />
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* wordmark + dropdown */}
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "21px", fontWeight: 700, color: "#0d2540", letterSpacing: "-0.03em" }}>
              gett
            </span>
            <span className="w-px h-4" style={{ background: "#ccdaec" }} />
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => { e.stopPropagation(); setDropOpen((o) => !o); }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                style={{ color: "#1b3a5c", fontWeight: 500, background: dropOpen ? "#e8f2fa" : "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e8f2fa")}
                onMouseLeave={e => (e.currentTarget.style.background = dropOpen ? "#e8f2fa" : "transparent")}
              >
                {LABELS[seg]}
                <CaretDown size={12} weight="bold" style={{ transition: "transform 0.2s", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {dropOpen && (
                <div className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #ccdaec", boxShadow: "0 8px 24px rgba(27,58,92,0.12)", minWidth: "168px", zIndex: 100 }}>
                  {SEGS.map((s) => (
                    <button
                      key={s}
                      onClick={() => pickSeg(s)}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{
                        background: s === seg ? "#e8f2fa" : "transparent",
                        color: s === seg ? "#0d2540" : "#1b3a5c",
                        fontWeight: s === seg ? 600 : 400,
                      }}
                      onMouseEnter={e => { if (s !== seg) e.currentTarget.style.background = "#f2f7fc"; }}
                      onMouseLeave={e => { if (s !== seg) e.currentTarget.style.background = "transparent"; }}
                    >
                      {LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ background: "#1b3a5c" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0d2540")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1b3a5c")}
          >
            Request access
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 grid items-center gap-10 lg:gap-16" style={{ gridTemplateColumns: "1fr auto", minHeight: "calc(100vh - 65px)", paddingTop: "5rem", paddingBottom: "5rem" }}>

        {/* LEFT: editorial text */}
        <div key={key} className="max-w-2xl">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: "#7ca0be", animation: "gFadeUp 0.45s ease both", letterSpacing: "0.18em" }}
          >
            Claims &middot; Settlements &middot; Communication
          </p>

          <h1
            style={{
              fontFamily: "var(--font-display, 'Playfair Display', serif)",
              fontSize: "clamp(54px, 7.5vw, 96px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#0d2540",
              animation: "gFadeUp 0.5s ease 0.06s both",
            }}
          >
            {d.h1}
            <br />
            <em style={{ fontStyle: "italic", color: "#2d6096" }}>{d.h2}</em>
          </h1>

          <p
            className="mt-6 text-lg leading-relaxed max-w-md"
            style={{ color: "#4a6a85", animation: "gFadeUp 0.5s ease 0.13s both" }}
          >
            {d.sub}
          </p>

          <div className="mt-8 flex items-center gap-3" style={{ animation: "gFadeUp 0.5s ease 0.2s both" }}>
            <button
              className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: "#1b3a5c" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0d2540")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1b3a5c")}
            >
              {d.cta}
              <ArrowRight size={14} weight="bold" />
            </button>
            <button
              className="rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: "#1b3a5c", border: "1px solid #ccdaec", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#1b3a5c"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccdaec"; }}
            >
              See how it works
            </button>
          </div>

          {/* editorial rule */}
          <div className="mt-12 flex items-center gap-4" style={{ animation: "gFadeUp 0.5s ease 0.26s both" }}>
            <span className="text-xs" style={{ color: "#7ca0be" }}>Trusted by law groups, employers, and carriers nationwide</span>
          </div>
        </div>

        {/* RIGHT: messenger mockup */}
        <div
          key={`chat-${key}`}
          className="hidden lg:block"
          style={{ width: "400px", animation: "gFadeUp 0.65s ease 0.1s both" }}
        >
          {/* dot-grid backdrop */}
          <div className="relative">
            <div
              className="absolute rounded-3xl"
              style={{
                inset: "-24px -12px",
                background: "radial-gradient(ellipse 85% 80% at 55% 45%, #dcedf8 0%, transparent 75%)",
                backgroundImage: "radial-gradient(#ccdaec 1.2px, transparent 1.2px), radial-gradient(ellipse 85% 80% at 55% 45%, #dcedf8 0%, transparent 75%)",
                backgroundSize: "22px 22px, 100% 100%",
                zIndex: 0,
              }}
            />

            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid #dde8f2",
                boxShadow: "0 20px 48px rgba(13,37,64,0.13), 0 4px 12px rgba(13,37,64,0.07)",
                zIndex: 1,
              }}
            >
              {/* chat header */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#1b3a5c" }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "#2d6096" }}
                >
                  {d.contact.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: "#fff" }}>{d.contact}</p>
                  <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#7ca0be" }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#4ade80" }} />
                    Active now
                  </p>
                </div>
              </div>

              {/* messages */}
              <div className="px-4 py-5 space-y-3" style={{ background: "#f3f7fb", minHeight: "280px" }}>
                {d.msgs.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.d === "out" ? "justify-end" : "justify-start"}`}
                    style={{
                      animation: `${msg.d === "out" ? "gBubbleR" : "gBubbleL"} 0.3s ease both`,
                      animationDelay: `${0.25 + i * 0.16}s`,
                    }}
                  >
                    <div className={`flex flex-col max-w-[78%] ${msg.d === "out" ? "items-end" : "items-start"}`}>
                      <div
                        className="px-3.5 py-2.5 text-sm leading-snug"
                        style={
                          msg.d === "out"
                            ? { background: "#1b3a5c", color: "#fff", borderRadius: "16px 16px 4px 16px" }
                            : { background: "#fff", color: "#0d2540", border: "1px solid #dde8f2", borderRadius: "16px 16px 16px 4px" }
                        }
                      >
                        {msg.t}
                      </div>
                      <span className="mt-1 px-1 text-[10px]" style={{ color: "#7ca0be" }}>{msg.ts}</span>
                    </div>
                  </div>
                ))}

                {/* typing indicator */}
                <div className="flex justify-start" style={{ animation: `gBubbleL 0.3s ease ${0.25 + d.msgs.length * 0.16}s both` }}>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center" style={{ background: "#fff", border: "1px solid #dde8f2" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#7ca0be", animation: "gBlink 1.4s infinite", animationDelay: `${i * 0.22}s` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* input bar */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid #dde8f2", background: "#fff" }}>
                <div className="flex-1 rounded-xl px-4 py-2.5 text-sm" style={{ background: "#f3f7fb", border: "1px solid #dde8f2", color: "#7ca0be" }}>
                  Message...
                </div>
                <button className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#1b3a5c" }}>
                  <ArrowRight size={14} weight="bold" className="text-white" />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: "#7ca0be" }}>
            Real conversations. Real resolutions.
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ borderTop: "1px solid #dde8f2", borderBottom: "1px solid #dde8f2", background: "#fff" }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3">
          {STATS.map(({ val, label }, i) => (
            <div
              key={val}
              className="py-10 md:px-12"
              style={{
                borderRight: i < 2 ? "1px solid #dde8f2" : "none",
                paddingLeft: i === 0 ? 0 : undefined,
                paddingRight: i === 2 ? 0 : undefined,
              }}
            >
              <p style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "clamp(40px, 4.5vw, 60px)", fontWeight: 700, color: "#1b3a5c", lineHeight: 1 }}>
                {val}
              </p>
              <p className="mt-2 text-sm" style={{ color: "#7ca0be" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7ca0be", letterSpacing: "0.18em" }}>How it works</span>
          <span className="flex-1 h-px" style={{ background: "#dde8f2" }} />
        </div>
        <h2
          style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "clamp(32px, 4vw, 50px)", fontWeight: 700, color: "#0d2540", lineHeight: 1.15, letterSpacing: "-0.02em" }}
          className="max-w-xl mb-16"
        >
          Everything claims needs.<br />
          <em style={{ fontStyle: "italic", color: "#2d6096" }}>Nothing it doesn&apos;t.</em>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="group">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: "#e8f2fa" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1b3a5c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#e8f2fa")}
              >
                <Icon size={22} weight="regular" style={{ color: "#1b3a5c", transition: "color 0.2s" }} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "20px", fontWeight: 700, color: "#0d2540", marginBottom: "8px" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#4a6a85" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ background: "#0d2540" }}>
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2d6096", letterSpacing: "0.18em" }}>
              Get started today
            </p>
            <h2 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Ready to modernize<br />
              <em style={{ fontStyle: "italic", color: "#7ca0be" }}>your claims process?</em>
            </h2>
            <p className="mt-4 text-sm leading-relaxed max-w-sm" style={{ color: "#7ca0be" }}>
              Join law groups, employers, and insurers who have streamlined their entire settlement workflow with gett.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
              style={{ background: "#fff", color: "#0d2540" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e8f2fa")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              Request a demo
              <ArrowRight size={14} weight="bold" />
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
            >
              View pricing
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0d2540", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
            gett
          </span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>© 2025 gett. All rights reserved.</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gFadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gBubbleR {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes gBubbleL {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes gBlink {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40%            { opacity: 1;    transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}
