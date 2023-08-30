import { contextProps } from "@trpc/react-query/shared";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const userInGameSchema = z.object({ gameId: z.string(), userId: z.string() });

export const userRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userName: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        where: {
          name: input.userName,
        },
      });
    }),

  connectUserToGame: publicProcedure
    .input(z.array(userInGameSchema))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.userInGame.createMany({
        data: input,
      });
    }),

  // TO DO:
  // Get users in game
  // Get all games connected to a user
  // Cet character controlled by user in game
});
