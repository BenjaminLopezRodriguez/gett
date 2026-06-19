type AuthContext = { params: Promise<{ kindeAuth: string }> };

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
