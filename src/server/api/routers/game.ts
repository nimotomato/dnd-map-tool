import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const gameRouter = createTRPCRouter({
  createGame: publicProcedure
    .input(
      z.object({
        name: z.string(),
        mapSrc: z.string(),
        mapPosX: z.number(),
        mapPosY: z.number(),
        dungeonMaster: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.create({
        data: {
          ...input,
          dungeonMaster: {
            connect: {
              id: input.dungeonMaster,
            },
          },
        },
      });
    }),

  // TO DO:
  // Get map position
  // Change map position
  // Get map src
  // Change map src
});
