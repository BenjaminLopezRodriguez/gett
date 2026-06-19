import { HydrateClient } from "@/trpc/server";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { LandingClient } from "./_components/landing-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <HydrateClient>
      <LandingClient
        authState={
          user
            ? {
                isLoggedIn: true,
                isOnboarded: !!(user.onboardingCompletedAt && user.persona),
                dashboardPath: user.persona
                  ? `/dashboard/${user.persona}`
                  : null,
              }
            : { isLoggedIn: false, isOnboarded: false, dashboardPath: null }
        }
      />
    </HydrateClient>
  );
}
