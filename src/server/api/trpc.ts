import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { ZodError } from "zod";

import { requireCaseMember } from "@/server/auth/case-access";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { db } from "@/server/db";
import type { CaseMemberRole, User } from "@/server/db/schema";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const user = await getCurrentUser();
  return { db, user, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms`);
  return result;
});

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user as User } });
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceUserIsAuthed);

export function caseProcedure(minimumRole: CaseMemberRole = "viewer") {
  return protectedProcedure
    .input(z.object({ caseId: z.string().uuid() }))
    .use(async ({ ctx, input, next }) => {
      const membership = await requireCaseMember(
        ctx.db,
        ctx.user.id,
        input.caseId,
        minimumRole,
      );
      return next({ ctx: { ...ctx, caseId: input.caseId, membership } });
    });
}
