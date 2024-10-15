import { createTRPCRouter, publicProcedure, TRPCError } from "../trpc";

export const sessionRouter = createTRPCRouter({
  get: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
});
