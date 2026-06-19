import { agentRouter } from "@/server/api/routers/agent";
import { caseRouter } from "@/server/api/routers/case";
import { commsRouter } from "@/server/api/routers/comms";
import { documentRouter } from "@/server/api/routers/document";
import { intakeRouter } from "@/server/api/routers/intake";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  case: caseRouter,
  document: documentRouter,
  agent: agentRouter,
  user: userRouter,
  intake: intakeRouter,
  comms: commsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
