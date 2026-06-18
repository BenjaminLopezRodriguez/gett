import { HydrateClient } from "@/trpc/server";
import { LandingClient } from "./_components/landing-client";

export default function Home() {
  return (
    <HydrateClient>
      <LandingClient />
    </HydrateClient>
  );
}
