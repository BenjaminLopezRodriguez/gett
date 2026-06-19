import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { cases } from "@/server/db/schema";
import { requireCaseMember } from "@/server/auth/case-access";
import { validateHandoffToken } from "@/server/intake/handoff";
import { resolveCurrentUser } from "@/server/auth/session";
import { createCase } from "@/server/services/cases";
import { VerifyGate } from "./_components/verify-gate";
import { UploadScanner } from "./_components/upload-scanner";

function TokenError({ message }: { message: string }) {
  return (
    <div
      style={{ backgroundColor: "#0e0d0c", minHeight: "100svh", color: "#ede5d0" }}
      className="flex flex-col items-center justify-center px-6"
    >
      <p
        className="font-[family-name:var(--font-heading)] mb-8 text-[2.75rem] font-bold leading-none tracking-tight"
        style={{ color: "#ede5d0" }}
      >
        gett
      </p>
      <div className="max-w-sm space-y-2 text-center">
        <p className="font-semibold" style={{ color: "#ede5d0" }}>
          Link unavailable
        </p>
        <p className="text-sm" style={{ color: "#6a6358" }}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  if (!t) {
    return <TokenError message="No token provided." />;
  }

  const token = await validateHandoffToken(t);

  if (!token) {
    return (
      <TokenError message="This link has expired or has already been used. Please request a new one." />
    );
  }

  const minutesRemaining = Math.max(
    1,
    Math.floor((token.expiresAt.getTime() - Date.now()) / 60_000),
  );

  const user = await resolveCurrentUser();

  if (!user) {
    const redirectUrl = `/start?t=${encodeURIComponent(t)}`;
    const loginUrl = `/api/auth/login?post_login_redirect_url=${encodeURIComponent(redirectUrl)}`;
    return <VerifyGate loginUrl={loginUrl} minutesRemaining={minutesRemaining} />;
  }

  let caseId: string;
  let caseHash: string;

  if (token.caseId) {
    try {
      await requireCaseMember(db, user.id, token.caseId, "viewer");
    } catch {
      return <TokenError message="You do not have access to this case." />;
    }
    const c = await db.query.cases.findFirst({
      where: eq(cases.id, token.caseId),
    });
    if (!c) return <TokenError message="Case not found." />;
    caseId = c.id;
    caseHash = c.caseHash;
  } else {
    // No caseId on token — create a new case for this upload
    const newCase = await createCase(user.id, "Document upload", {
      source: "handoff",
    });
    caseId = newCase.id;
    caseHash = newCase.caseHash;
  }

  return <UploadScanner caseId={caseId} caseHash={caseHash} token={t} />;
}
