import { notFound, redirect } from "next/navigation";

import { env } from "@/env";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardPath, isUserPersona } from "@/server/lib/persona";
import { api, HydrateClient } from "@/trpc/server";
import { EmployeeDashboard } from "../_components/employee-dashboard";
import { EmployerDashboard } from "../_components/employer-dashboard";
import { InsurerDashboard } from "../_components/insurer-dashboard";
import { LawgroupDashboard } from "../_components/lawgroup-dashboard";

const PERSONA_ENABLED: Record<string, boolean> = {
  employee: env.NEXT_PUBLIC_ENABLE_EMPLOYEE_PERSONA,
  employer: env.NEXT_PUBLIC_ENABLE_EMPLOYER_PERSONA,
  lawgroup: true, // always on — the wedge
  insurer: env.NEXT_PUBLIC_ENABLE_INSURER_PERSONA,
};

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

  if (!PERSONA_ENABLED[persona]) {
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
