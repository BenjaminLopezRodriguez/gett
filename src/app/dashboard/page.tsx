import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardPath } from "@/server/lib/persona";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/login?post_login_redirect_url=/dashboard");
  }

  if (!user.onboardingCompletedAt || !user.persona) {
    redirect("/onboarding");
  }

  redirect(getDashboardPath(user.persona));
}
