"use client";

import Link from "next/link";
import { useState } from "react";

import type { Case } from "@/server/db/schema";
import { api } from "@/trpc/react";

type AgentKind = "intake" | "summary" | "examination";

export function CaseDetailClient({ caseRecord }: { caseRecord: Case }) {
  const [input, setInput] = useState("");
  const [agentKind, setAgentKind] = useState<AgentKind>("summary");
  const [agentOutput, setAgentOutput] = useState<string | null>(null);

  const { data: events } = api.case.auditLog.useQuery({
    caseId: caseRecord.id,
  });

  const intakeAgent = api.agent.intake.useMutation({
    onSuccess: (result) => setAgentOutput(JSON.stringify(result, null, 2)),
  });
  const summaryAgent = api.agent.summarize.useMutation({
    onSuccess: (result) => setAgentOutput(result.summary),
  });

  const runSelectedAgent = () => {
    if (!input.trim()) return;
    if (agentKind === "intake") {
      intakeAgent.mutate({
        caseId: caseRecord.id,
        messages: [input.trim()],
      });
    } else if (agentKind === "summary") {
      summaryAgent.mutate({ caseId: caseRecord.id });
    } else {
      setAgentOutput("Document examination requires uploading a document first.");
    }
  };

  const isPending = intakeAgent.isPending || summaryAgent.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to dashboard
          </Link>
          <Link href="/" className="font-[family-name:var(--font-heading)] text-xl font-semibold">
            gett
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="font-mono text-sm text-muted-foreground">{caseRecord.caseHash}</p>
          <h1 className="font-[family-name:var(--font-heading)] mt-1 text-3xl font-semibold tracking-tight">
            {caseRecord.title}
          </h1>
          <p className="mt-2 capitalize text-muted-foreground">
            Status: {caseRecord.status.replace("_", " ")}
          </p>
        </div>

        <section className="mb-10 rounded-lg border border-border p-6">
          <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
            Run agent
          </h2>
          <div className="mb-3 flex gap-2">
            {(
              [
                ["intake", "Intake"],
                ["summary", "Summary"],
                ["examination", "Document exam"],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => setAgentKind(type)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  agentKind === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              agentKind === "summary"
                ? "Summary uses case data — optional notes…"
                : "Describe what you need the agent to do…"
            }
            rows={4}
            className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={(agentKind !== "summary" && !input.trim()) || isPending}
            onClick={runSelectedAgent}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Running…" : "Run agent"}
          </button>
          {agentOutput && (
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
              {agentOutput}
            </pre>
          )}
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-heading)] mb-4 text-lg font-semibold">
            Audit trail
          </h2>
          {events && events.length > 0 ? (
            <ul className="space-y-2">
              {events.map((event: { id: string; eventType: string; createdAt: Date }) => (
                <li
                  key={event.id}
                  className="rounded-md border border-border px-4 py-3 text-sm"
                >
                  <div className="flex justify-between gap-4">
                    <span className="font-medium">{event.eventType}</span>
                    <time className="text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No events recorded yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}
