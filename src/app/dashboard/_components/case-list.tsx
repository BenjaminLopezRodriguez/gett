"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "@/trpc/react";

export function CaseList({
  emptyMessage = "No cases yet.",
  showCreate = true,
}: {
  emptyMessage?: string;
  showCreate?: boolean;
}) {
  const utils = api.useUtils();
  const { data: cases, isLoading } = api.case.list.useQuery();
  const [title, setTitle] = useState("");
  const createCase = api.case.create.useMutation({
    onSuccess: async () => {
      setTitle("");
      await utils.case.list.invalidate();
    },
  });

  if (isLoading) {
    return <p className="gett-muted">Loading cases…</p>;
  }

  return (
    <div>
      {showCreate && (
        <form
          className="gett-case-form"
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
            className="gett-input"
          />
          <button
            type="submit"
            disabled={createCase.isPending}
            className="gett-btn-primary"
          >
            {createCase.isPending ? "Creating…" : "Create case"}
          </button>
        </form>
      )}

      {cases && cases.length > 0 ? (
        <ul className="gett-case-list">
          {cases.map((c) => (
            <li key={c.id}>
              <Link href={`/cases/${c.id}`} className="gett-case-row">
                <div>
                  <p className="gett-case-title">{c.title}</p>
                  <p className="gett-case-hash">{c.caseHash}</p>
                </div>
                <span className="gett-case-status">{c.status.replace("_", " ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gett-muted">{emptyMessage}</p>
      )}
    </div>
  );
}
