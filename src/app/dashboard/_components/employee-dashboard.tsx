"use client";

import { CaseList } from "./case-list";
import { DashboardShell } from "./dashboard-shell";

export function EmployeeDashboard({ userEmail }: { userEmail: string }) {
  return (
    <DashboardShell persona="employee" userEmail={userEmail}>
      <h1 className="gett-dash-title">Your leave & benefits</h1>
      <p className="gett-dash-subtitle">
        Track FMLA requests, disability filings, and medical paperwork in one place.
      </p>
      <CaseList emptyMessage="No cases yet. Start a leave request above." />
    </DashboardShell>
  );
}
