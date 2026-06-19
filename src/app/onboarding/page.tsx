import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardPath } from "@/server/lib/persona";
import { api, HydrateClient } from "@/trpc/server";
import { OnboardingFlow } from "./_components/onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/login?post_login_redirect_url=/onboarding");
  }

  const params = await searchParams;
  const verifyOnly = params.step === "verify";

  if (user.onboardingCompletedAt && user.persona && !verifyOnly) {
    redirect(getDashboardPath(user.persona));
  }

  if (verifyOnly && (!user.onboardingCompletedAt || !user.persona)) {
    redirect("/onboarding");
  }

  void api.user.getSetupStatus.prefetch();

  return (
    <HydrateClient>
      <OnboardingFlow
        userEmail={user.email}
        initialStep={verifyOnly ? 2 : 1}
        initialPersona={verifyOnly ? user.persona : null}
        verifyOnly={verifyOnly}
      />
    </HydrateClient>
  );
}
