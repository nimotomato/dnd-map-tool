import { contextProps } from "@trpc/react-query/shared";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  // Get user
  getUser: publicProcedure
    .input(z.object({ userEmail: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findFirst({
        where: {
          email: input.userEmail,
        },
      });
    }),

  // Get many users, takes in emails
  getUsersInGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.userInGame.findMany({
        where: {
          gameId: {
            equals: input.gameId,
          },
        },
        select: {
          user: true,
        },
      });
    }),

  // TO DO:
  // Get users in game
  // Get all games connected to a user
  // Cet character controlled by user in game
});
