"use client";

import { useState } from "react";
import {
  ChatCircleText,
  CheckCircle,
  Copy,
  DeviceMobile,
  Phone,
  PlusCircle,
  UserCircle,
} from "@phosphor-icons/react";

import { buildTelUrl } from "@/lib/comms/sms-url";
import type { TemplateId } from "@/lib/comms/templates";
import { api } from "@/trpc/react";

interface CaseCommsPanelProps {
  caseId: string;
}

interface PreviewResult {
  previewBody: string;
  smsUrl: string;
  handoffUrl: string;
  expiresAt: Date;
}

function isTouchDevice() {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

function CaseCommsHistory({ caseId }: { caseId: string }) {
  const { data: messages } = api.comms.getCaseMessages.useQuery({ caseId });
  if (!messages?.length) return null;
  return (
    <section className="rounded-lg border border-border p-6">
      <h2 className="font-[family-name:var(--font-heading)] mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        History
      </h2>
      <ul className="space-y-1">
        {messages.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center gap-2.5">
              <ChatCircleText size={14} className="text-muted-foreground" />
              <span className="font-medium capitalize">
                {m.templateId.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground">· {m.channel}</span>
            </div>
            <time className="font-mono text-[0.7rem] text-muted-foreground">
              {new Date(m.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CaseCommsPanel({ caseId }: CaseCommsPanelProps) {
  const { data: contacts, refetch: refetchContacts } =
    api.comms.getCaseContacts.useQuery({ caseId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  const upsert = api.comms.upsertCaseContact.useMutation({
    onSuccess: () => {
      void refetchContacts();
      setShowAddForm(false);
      setDisplayName("");
      setPhoneE164("");
      setSmsConsent(false);
    },
  });

  const [templateId, setTemplateId] = useState<TemplateId>("secure_upload");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);

  const buildTemplate = api.comms.buildMessageTemplate.useMutation({
    onSuccess: (data) => {
      setPreview(data as PreviewResult);
      setLogged(false);
    },
  });

  const logSent = api.comms.logOutboundComms.useMutation({
    onSuccess: () => setLogged(true),
  });

  const clientContact = contacts?.find((c) => c.role === "client");
  const isMobile = isTouchDevice();

  const TEMPLATE_LABELS: Record<TemplateId, string> = {
    secure_upload: "Secure upload",
    reminder: "Reminder",
  };

  return (
    <div className="space-y-4">
      {/* Contact card */}
      <section className="rounded-lg border border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Client contact
          </h2>
          {clientContact && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          )}
        </div>

        {clientContact && !showAddForm ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
            <UserCircle size={32} className="shrink-0 text-muted-foreground" weight="light" />
            <div className="min-w-0">
              <p className="truncate font-medium">{clientContact.displayName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {clientContact.phoneE164}
              </p>
            </div>
            {clientContact.smsConsentAt && (
              <span className="ml-auto shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                SMS consent
              </span>
            )}
          </div>
        ) : !showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <PlusCircle size={15} />
            Add client contact
          </button>
        ) : null}

        {showAddForm && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              upsert.mutate({
                caseId,
                role: "client",
                phoneE164,
                displayName,
                smsConsentAt: smsConsent ? new Date() : undefined,
              });
            }}
          >
            <div className="grid gap-2.5">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full name"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={phoneE164}
                onChange={(e) => setPhoneE164(e.target.value)}
                placeholder="+1 555 123 4567"
                required
                type="tel"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-muted-foreground">
                Client has consented to SMS communications
              </span>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={upsert.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {upsert.isPending ? "Saving…" : "Save contact"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Template builder */}
      {clientContact && (
        <section className="rounded-lg border border-border p-6">
          <h2 className="font-[family-name:var(--font-heading)] mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Send template
          </h2>

          {/* Template selector */}
          <div className="mb-5 flex gap-2">
            {(["secure_upload", "reminder"] as TemplateId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTemplateId(id);
                  setPreview(null);
                  setLogged(false);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  templateId === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {TEMPLATE_LABELS[id]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setLogged(false);
              buildTemplate.mutate({ caseId, templateId });
            }}
            disabled={buildTemplate.isPending}
            className="mb-5 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
          >
            {buildTemplate.isPending ? "Generating…" : "Preview message"}
          </button>

          {/* SMS bubble preview */}
          {preview && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <DeviceMobile
                    size={13}
                    className="text-muted-foreground"
                    weight="light"
                  />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    SMS preview · {clientContact.displayName}
                  </span>
                </div>
                {/* Bubble */}
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: "oklch(0.205 0 0)",
                      color: "oklch(0.985 0 0)",
                    }}
                  >
                    {preview.previewBody}
                  </div>
                </div>
                <p className="mt-2 text-right font-mono text-[10px] text-muted-foreground">
                  Expires{" "}
                  {new Date(preview.expiresAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {isMobile && (
                  <a
                    href={preview.smsUrl}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <ChatCircleText size={14} weight="bold" />
                    Text client
                  </a>
                )}
                <a
                  href={buildTelUrl(clientContact.phoneE164)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm text-foreground hover:bg-muted/50"
                >
                  <Phone size={13} />
                  Call
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(preview.handoffUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm text-foreground hover:bg-muted/50"
                >
                  <Copy size={13} />
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  type="button"
                  disabled={logged || logSent.isPending}
                  onClick={() =>
                    logSent.mutate({ caseId, templateId, channel: "sms" })
                  }
                  className="ml-auto flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {logged ? (
                    <>
                      <CheckCircle size={13} className="text-green-600" />
                      Logged
                    </>
                  ) : (
                    "I sent this"
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* History */}
      <CaseCommsHistory caseId={caseId} />
    </div>
  );
}
