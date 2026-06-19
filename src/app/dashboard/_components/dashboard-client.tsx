"use client";

import Link from "next/link";
import { useState } from "react";

import type { Case } from "@/server/db/schema";
import { api } from "@/trpc/react";

export function DashboardClient({ userEmail }: { userEmail: string }) {
  const [title, setTitle] = useState("");
  const utils = api.useUtils();
  const { data: cases, isLoading } = api.case.list.useQuery();
  const createCase = api.case.create.useMutation({
    onSuccess: async () => {
      setTitle("");
      await utils.case.list.invalidate();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-[family-name:var(--font-heading)] text-xl font-semibold">
            gett
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{userEmail}</span>
            <Link href="/api/auth/logout" className="hover:text-foreground">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            Your cases
          </h1>
          <p className="mt-2 text-muted-foreground">
            Medical leave compliance cases you have access to.
          </p>
        </div>

        <form
          className="mb-10 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createCase.mutate({ title: title.trim() });
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New case title"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={createCase.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {createCase.isPending ? "Creating…" : "Create case"}
          </button>
        </form>

        {isLoading ? (
          <p className="text-muted-foreground">Loading cases…</p>
        ) : cases && cases.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{c.caseHash}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize text-secondary-foreground">
                    {c.status.replace("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No cases yet. Create one above.</p>
        )}
      </main>
    </div>
  );
}
