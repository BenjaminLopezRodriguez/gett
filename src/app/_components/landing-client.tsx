"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import {
  CaretDown,
  X,
  ClipboardText,
  BookOpen,
  NotePencil,
  Shield,
  UsersThree,
  ChartBar,
  UserPlus,
  Files,
  CalendarBlank,
  CheckCircle,
  Clock,
  User,
  Buildings,
  Scales,
  type IconProps,
} from "@phosphor-icons/react";

type Seg = "employees" | "employers" | "lawgroups" | "insurers";
type AnyIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

interface Card { Icon: AnyIcon; title: string; sub: string; }
interface SegContent {
  navLabel: string;
  headline: string;
  headlineBlue: string;
  tagline: string;
  description: string;
  placeholder: string;
  cards: Card[];
  visual: { label: string; status: string; lines: string[] };
}

const CONTENT: Record<Seg, SegContent> = {
  employees: {
    navLabel: "for employees",
    headline: "Medical paperwork,",
    headlineBlue: "handled.",
    tagline: "Get care when you need it.",
    description:
      "gett helps you understand your employee benefits, file for medical leave or disability, and stay on top of your excuse notes and accommodation requests — all in one place.",
    placeholder: "e.g. I need to take medical leave — where do I begin?",
    visual: {
      label: "Leave request · FMLA",
      status: "In review",
      lines: [
        "Employer notified automatically",
        "Doctor certification attached",
        "Estimated approval: 2 days",
      ],
    },
    cards: [
      { Icon: ClipboardText, title: "FMLA & disability filing", sub: "We handle every form, step by step." },
      { Icon: BookOpen, title: "Understanding your benefits", sub: "Know exactly what you're covered for." },
      { Icon: NotePencil, title: "Medical excuse notes", sub: "Submit accommodation requests with ease." },
    ],
  },
  employers: {
    navLabel: "for employers",
    headline: "HR compliance,",
    headlineBlue: "simplified.",
    tagline: "Keep your workforce covered.",
    description:
      "gett helps employers stay ahead of FMLA, ADA, and state leave requirements — while giving employees a guided, self-service experience for all their medical paperwork.",
    placeholder: "e.g. How do we reduce FMLA compliance risk across our org?",
    visual: {
      label: "Compliance dashboard",
      status: "All clear",
      lines: [
        "12 open leave cases tracked",
        "ADA requests routed correctly",
        "Zero missed deadlines this quarter",
      ],
    },
    cards: [
      { Icon: Shield, title: "FMLA compliance tracking", sub: "Stay ahead of federal and state requirements." },
      { Icon: UsersThree, title: "ADA accommodation management", sub: "Streamline requests and documentation." },
      { Icon: ChartBar, title: "Leave analytics", sub: "Spot trends and reduce unplanned absences." },
    ],
  },
  lawgroups: {
    navLabel: "for law groups",
    headline: "More cases,",
    headlineBlue: "less admin.",
    tagline: "Grow your practice with gett.",
    description:
      "gett helps law groups capture and manage more disability and workers' comp cases by guiding clients through medical documentation, benefits understanding, and leave filing from day one.",
    placeholder: "e.g. How can gett help my firm get more disability cases?",
    visual: {
      label: "Client intake · Case #4412",
      status: "Docs complete",
      lines: [
        "Medical records verified",
        "Benefits summary generated",
        "Ready for attorney review",
      ],
    },
    cards: [
      { Icon: UserPlus, title: "Client intake automation", sub: "Capture and qualify more leads." },
      { Icon: Files, title: "Medical documentation", sub: "Ensure complete case files from the start." },
      { Icon: CalendarBlank, title: "Case tracking", sub: "Monitor timelines and deadlines at a glance." },
    ],
  },
  insurers: {
    navLabel: "for insurers",
    headline: "Streamline",
    headlineBlue: "every claim.",
    tagline: "Manage more cases, faster.",
    description:
      "gett helps insurers reduce friction in disability and leave claims by ensuring claimants submit proper documentation — correctly filed, before it reaches your desk.",
    placeholder: "e.g. How does gett reduce incomplete claim submissions?",
    visual: {
      label: "Claim #77-B · Disability",
      status: "Ready to close",
      lines: [
        "MSA documentation verified",
        "Leave period confirmed",
        "Payment issued · file closed",
      ],
    },
    cards: [
      { Icon: CheckCircle, title: "Claims documentation", sub: "Receive complete, verified submissions." },
      { Icon: Clock, title: "Leave verification", sub: "Faster turnarounds on medical certifications." },
      { Icon: ChartBar, title: "Compliance reporting", sub: "Audit trails and regulatory documentation." },
    ],
  },
};

const DIALOG_OPTIONS: { seg: Seg; label: string; desc: string; Icon: AnyIcon }[] = [
  { seg: "employees",  label: "I'm an employee",     desc: "Help me with benefits, leave, or paperwork",    Icon: User      },
  { seg: "employers",  label: "I'm an employer / HR", desc: "Improve compliance and reduce admin overhead",  Icon: Buildings },
  { seg: "lawgroups",  label: "I'm with a law group", desc: "Grow my disability or workers' comp practice",  Icon: Scales    },
  { seg: "insurers",   label: "I'm an insurer",       desc: "Streamline claims and reduce friction",         Icon: Shield    },
];

export function LandingClient() {
  const [seg, setSeg] = useState<Seg>("employees");
  const [dialogOpen, setDialogOpen] = useState(false);
  const c = CONTENT[seg];

  function choose(s: Seg) {
    setSeg(s);
    setDialogOpen(false);
  }

  return (
    <div dir="ltr" className="gett-page">

      <nav className="gett-nav">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="gett-logo">gett</span>
            <span className="gett-nav-divider" />

            <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
              <Dialog.Trigger asChild>
                <button type="button" className="gett-nav-seg">
                  {c.navLabel}
                  <CaretDown
                    size={12}
                    weight="bold"
                    style={{ transition: "transform 0.2s", transform: dialogOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="gett-overlay" />
                <Dialog.Content className="gett-dialog" aria-describedby={undefined}>
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="gett-dialog-title">
                      I am&hellip;
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="gett-close-btn">
                        <X size={17} weight="bold" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="gett-options-grid">
                    {DIALOG_OPTIONS.map(({ seg: s, label, desc, Icon }) => (
                      <button
                        key={s}
                        onClick={() => choose(s)}
                        className={`gett-option${s === seg ? " gett-option-active" : ""}`}
                      >
                        <div className="gett-opt-icon">
                          <Icon size={22} weight="regular" />
                        </div>
                        <p className="gett-opt-label">{label}</p>
                        <p className="gett-opt-desc">{desc}</p>
                      </button>
                    ))}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </nav>

      <main key={seg} className="gett-hero max-w-6xl mx-auto px-6">
        <div className="gett-hero-grid">
          <div className="gett-hero-copy">
            <h1 className="gett-headline">
              {c.headline}
              <br />
              <span className="gett-headline-accent">{c.headlineBlue}</span>
            </h1>

            <p className="gett-tagline">{c.tagline}</p>
            <p className="gett-description">{c.description}</p>

            <div className="gett-cards">
              {c.cards.map(({ Icon, title, sub }) => (
                <div key={title} className="service-card">
                  <div className="svc-icon-box">
                    <Icon size={20} weight="regular" />
                  </div>
                  <p className="gett-card-title">{title}</p>
                  <p className="gett-card-sub">{sub}</p>
                </div>
              ))}
            </div>

            <div className="gett-compose">
              <p className="gett-compose-label">Not sure where to start? Text us.</p>
              <form className="gett-compose-form">
                <div className="gett-compose-field">
                  <span className="gett-compose-dot" />
                  <input
                    type="text"
                    placeholder={c.placeholder}
                    className="gett-compose-input"
                  />
                </div>
                <button type="submit" className="gett-compose-send">
                  Send
                </button>
              </form>
            </div>
          </div>

          <aside className="gett-hero-visual" aria-hidden>
            <div className="gett-doc-stack">
              <div className="gett-doc gett-doc-back" />
              <div className="gett-doc gett-doc-mid" />
              <div className="gett-doc gett-doc-front">
                <div className="gett-doc-head">
                  <span className="gett-doc-label">{c.visual.label}</span>
                  <span className="gett-doc-status">{c.visual.status}</span>
                </div>
                <div className="gett-doc-body">
                  {c.visual.lines.map((line) => (
                    <div key={line} className="gett-doc-line">
                      <CheckCircle size={15} weight="fill" className="gett-doc-check" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
                <div className="gett-doc-footer">
                  <span>Powered by gett</span>
                  <span className="gett-doc-stamp">Verified</span>
                </div>
              </div>
            </div>
            <p className="gett-visual-caption">Real paperwork. Real progress.</p>
          </aside>
        </div>
      </main>

      <style>{`
        .gett-page {
          --font-body: var(--font-geist-sans), "Geist", ui-sans-serif, system-ui, sans-serif;
          --font-display: var(--font-heading), "Figtree", ui-sans-serif, system-ui, sans-serif;
          --ink: #08103a;
          --ink-muted: #606898;
          --ink-faint: #9099C8;
          --blue: #3040F5;
          --blue-soft: #EEF0FF;
          --blue-border: #D8DCFF;

          min-height: 100vh;
          background: #fff;
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .gett-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--blue);
        }
        .gett-logo {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .gett-nav-divider {
          width: 1px;
          height: 15px;
          background: rgba(255, 255, 255, 0.22);
          display: inline-block;
        }
        .gett-nav-seg {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: rgba(255, 255, 255, 0.82);
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          transition: color 0.2s, background 0.2s;
        }
        .gett-nav-seg:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
        }

        .gett-headline {
          margin: 0;
          max-width: 12ch;
          font-family: var(--font-display);
          font-size: clamp(2.75rem, 5.5vw + 1rem, 4.75rem);
          font-weight: 700;
          line-height: 1.02;
          letter-spacing: -0.032em;
          color: var(--ink);
        }
        .gett-headline-accent {
          color: var(--blue);
        }
        .gett-tagline {
          margin: 1.25rem 0 0;
          max-width: 28rem;
          font-family: var(--font-display);
          font-size: clamp(1.0625rem, 1vw + 0.75rem, 1.25rem);
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: -0.015em;
          color: var(--blue);
        }
        .gett-description {
          margin: 1rem 0 0;
          max-width: 32rem;
          font-size: 1.0625rem;
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: -0.011em;
          color: var(--ink-muted);
        }

        .gett-cards {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          max-width: 680px;
          margin-top: 2.5rem;
        }
        .gett-card-title {
          margin: 0 0 6px;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: -0.012em;
          color: var(--ink);
        }
        .gett-card-sub {
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.55;
          color: var(--ink-faint);
        }

        .gett-compose {
          margin-top: 3rem;
          max-width: 32rem;
        }
        .gett-compose-label {
          margin: 0 0 0.75rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }
        .gett-compose-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .gett-compose-field {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-radius: 999px;
          border: 1.5px solid var(--blue-border);
          background: #F0F3FF;
        }
        .gett-compose-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22C55E;
          flex-shrink: 0;
        }
        .gett-compose-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 400;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .gett-compose-input::placeholder {
          color: var(--ink-faint);
        }
        .gett-compose-send {
          flex-shrink: 0;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 999px;
          background: var(--blue);
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: opacity 0.2s;
        }
        .gett-compose-send:hover {
          opacity: 0.9;
        }

        .gett-dialog-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--ink);
        }

        .gett-hero {
          padding-top: 80px;
          padding-bottom: 80px;
          min-height: calc(100vh - 56px);
          animation: gettHeroIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gettHeroIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .gett-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .gett-hero-grid {
            grid-template-columns: 1.1fr 0.9fr;
            gap: 40px;
          }
        }

        .gett-hero-visual {
          display: none;
          flex-direction: column;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .gett-hero-visual { display: flex; }
        }

        .gett-doc-stack {
          position: relative;
          width: min(100%, 380px);
          height: 420px;
        }
        .gett-doc {
          position: absolute;
          border-radius: 18px;
          border: 1.5px solid #D8DCFF;
          background: #fff;
        }
        .gett-doc-back {
          inset: 28px 18px auto 18px;
          height: 320px;
          transform: rotate(-4deg);
          background: #F0F3FF;
          opacity: 0.75;
        }
        .gett-doc-mid {
          inset: 14px 10px auto 10px;
          height: 330px;
          transform: rotate(2deg);
          background: #F8F9FF;
          opacity: 0.9;
        }
        .gett-doc-front {
          inset: 0 0 auto 0;
          height: 340px;
          box-shadow: 0 24px 64px rgba(48, 64, 245, 0.12), 0 4px 16px rgba(8, 16, 58, 0.06);
          display: flex;
          flex-direction: column;
          animation: gettDocFloat 6s ease-in-out infinite;
        }
        @keyframes gettDocFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
        }
        .gett-doc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid #E0E4FF;
          background: linear-gradient(180deg, #F0F3FF, transparent);
        }
        .gett-doc-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .gett-doc-status {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--blue);
          background: var(--blue-soft);
        }
        .gett-doc-body {
          flex: 1;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .gett-doc-line {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: -0.01em;
          color: var(--ink-muted);
        }
        .gett-doc-check {
          color: #3040F5;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .gett-doc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-top: 1px dashed var(--blue-border);
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: var(--ink-faint);
        }
        .gett-doc-stamp {
          padding: 4px 10px;
          border: 1.5px solid rgba(48, 64, 245, 0.35);
          border-radius: 6px;
          color: var(--blue);
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transform: rotate(-4deg);
        }
        .gett-visual-caption {
          margin-top: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--ink-faint);
          text-align: center;
        }

        .service-card {
          background: #fff;
          border: 1.5px solid #D8DCFF;
          border-radius: 20px;
          padding: 20px;
          width: 200px;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          cursor: default;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .service-card:hover {
          border-color: #3040F5;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(48,64,245,0.11);
        }
        .svc-icon-box {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #EEF0FF, #DDE1FF);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          color: #3040F5;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .service-card:hover .svc-icon-box {
          background: linear-gradient(135deg, #3040F5, #5060FF);
          color: #fff;
        }

        .gett-overlay {
          position: fixed; inset: 0;
          background: rgba(8,16,58,0.45);
          backdrop-filter: blur(4px);
          z-index: 100;
          animation: gettFadeIn 0.18s ease;
        }
        @keyframes gettFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .gett-dialog {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          width: min(560px, calc(100vw - 32px));
          z-index: 101;
          box-shadow: 0 24px 64px rgba(8,16,58,0.2);
          outline: none;
          animation: gettDialogIn 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes gettDialogIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .gett-close-btn {
          width: 34px; height: 34px;
          border-radius: 100px;
          background: #F0F3FF;
          border: none;
          display: flex; align-items: center; justify-content: center;
          color: #606898;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .gett-close-btn:hover { background: #E0E4FF; color: #3040F5; }

        .gett-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .gett-option {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 20px;
          border: 1.5px solid #E0E4FF;
          border-radius: 16px;
          background: #fff;
          cursor: pointer; text-align: left;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .gett-option:hover {
          border-color: #3040F5;
          background: #F8F9FF;
          transform: translateY(-1px);
        }
        .gett-option-active {
          border-color: #3040F5 !important;
          background: #EEF0FF !important;
        }
        .gett-option-active .gett-opt-icon {
          background: linear-gradient(135deg, #3040F5, #5060FF) !important;
          color: #fff !important;
        }

        .gett-opt-icon {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: #EEF0FF;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
          color: #3040F5;
          transition: background 0.15s, color 0.15s;
        }

        .gett-opt-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--ink);
          margin: 0 0 4px;
          letter-spacing: -0.012em;
          line-height: 1.35;
        }
        .gett-opt-desc {
          font-size: 0.8125rem;
          font-weight: 400;
          color: var(--ink-faint);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 720px) {
          .gett-compose-form { flex-direction: column; align-items: stretch; }
          .gett-compose-send { text-align: center; }
        }

        @media (max-width: 480px) {
          .gett-options-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
