import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { getCaseForUser } from "@/server/services/cases";
import { api, HydrateClient } from "@/trpc/server";
import { CaseDetailClient } from "./_components/case-detail-client";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/login");
  }

  const { caseId } = await params;

  try {
    const caseRecord = await getCaseForUser(caseId, user.id);
    void api.case.auditLog.prefetch({ caseId });
    return (
      <HydrateClient>
        <CaseDetailClient caseRecord={caseRecord} />
      </HydrateClient>
    );
  } catch {
    notFound();
  }
}
