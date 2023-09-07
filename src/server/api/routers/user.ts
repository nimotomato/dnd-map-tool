import { contextProps } from "@trpc/react-query/shared";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

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

  removeUserFromGame: publicProcedure
    .input(z.object({ gameId: z.string(), controllerId: z.string() }))
    .mutation(({ ctx, input }) => {
      const deleteCharacter = ctx.prisma.character.deleteMany({
        where: {
          controllerId: input.controllerId,
          gameId: input.gameId,
        },
      });

      const removeUser = ctx.prisma.userInGame.deleteMany({
        where: {
          userId: input.controllerId,
          gameId: input.gameId,
        },
      });

      return prisma.$transaction([deleteCharacter, removeUser]);
    }),
});
