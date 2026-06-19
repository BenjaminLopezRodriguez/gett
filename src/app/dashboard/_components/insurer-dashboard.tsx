"use client";

import { CaseList } from "./case-list";
import { DashboardShell } from "./dashboard-shell";

export function InsurerDashboard({ userEmail }: { userEmail: string }) {
  return (
    <DashboardShell persona="insurer" userEmail={userEmail}>
      <h1 className="gett-dash-title">Claims workspace</h1>
      <p className="gett-dash-subtitle">
        Review disability and leave claims with verified documentation before adjudication.
      </p>
      <CaseList
        showCreate
        emptyMessage="No claims yet. Create a claim case to get started."
      />
    </DashboardShell>
  );
}
