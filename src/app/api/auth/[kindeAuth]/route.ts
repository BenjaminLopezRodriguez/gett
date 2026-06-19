type AuthContext = { params: Promise<{ kindeAuth: string }> };

// Lazy import so `handleAuth()` env checks run at request time, not during
// `next build` when SKIP_ENV_VALIDATION may omit Kinde vars.
// Endpoints: login, logout, register, kinde_callback (not /callback).
async function getAuthHandler() {
  const { handleAuth } = await import("@kinde-oss/kinde-auth-nextjs/server");
  return handleAuth();
}

export async function GET(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const handler = await getAuthHandler();
  return handler(request, context) as Promise<Response>;
}

export async function POST(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const handler = await getAuthHandler();
  return handler(request, context) as Promise<Response>;
}
