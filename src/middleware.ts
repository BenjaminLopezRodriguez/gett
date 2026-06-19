import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function middleware() {},
  {
    isReturnToCurrentPage: true,
    publicPaths: ["/", "/api/auth", "/start"],
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/onboarding",
    "/api/agents/:path*",
  ],
};
