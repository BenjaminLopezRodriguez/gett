import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardPath, isUserPersona } from "@/server/lib/persona";
import { api, HydrateClient } from "@/trpc/server";
import { EmployeeDashboard } from "../_components/employee-dashboard";
import { EmployerDashboard } from "../_components/employer-dashboard";
import { InsurerDashboard } from "../_components/insurer-dashboard";
import { LawgroupDashboard } from "../_components/lawgroup-dashboard";

export const dynamic = "force-dynamic";

export default async function PersonaDashboardPage({
  params,
}: {
  params: Promise<{ persona: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/login?post_login_redirect_url=/dashboard");
  }

  if (!user.onboardingCompletedAt || !user.persona) {
    redirect("/onboarding");
  }

  const { persona } = await params;
  if (!isUserPersona(persona)) {
    notFound();
  }

  if (user.persona !== persona) {
    redirect(getDashboardPath(user.persona));
  }

  void api.case.list.prefetch();
  void api.user.getSetupStatus.prefetch();
  void api.user.getProfile.prefetch();

  const dashboards = {
    employee: <EmployeeDashboard userEmail={user.email} />,
    employer: <EmployerDashboard userEmail={user.email} />,
    lawgroup: <LawgroupDashboard userEmail={user.email} />,
    insurer: <InsurerDashboard userEmail={user.email} />,
  } as const;

  return <HydrateClient>{dashboards[persona]}</HydrateClient>;
}
