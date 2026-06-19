"use client";

import { CaseList } from "./case-list";
import { DashboardShell } from "./dashboard-shell";

export function LawgroupDashboard({ userEmail }: { userEmail: string }) {
  return (
    <DashboardShell persona="lawgroup" userEmail={userEmail}>
      <h1 className="gett-dash-title">Client cases</h1>
      <p className="gett-dash-subtitle">
        Manage disability and workers&apos; comp intakes with complete medical documentation.
      </p>
      <CaseList
        showCreate
        emptyMessage="No client cases yet. Create a case to begin intake."
      />
    </DashboardShell>
  );
}
