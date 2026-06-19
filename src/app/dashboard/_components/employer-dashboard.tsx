"use client";

import { CaseList } from "./case-list";
import { DashboardShell } from "./dashboard-shell";

export function EmployerDashboard({ userEmail }: { userEmail: string }) {
  return (
    <DashboardShell persona="employer" userEmail={userEmail}>
      <h1 className="gett-dash-title">Compliance dashboard</h1>
      <p className="gett-dash-subtitle">
        Monitor FMLA, ADA, and state leave cases across your organization.
      </p>
      <CaseList emptyMessage="No cases yet. Create an organization case above." />
    </DashboardShell>
  );
}
