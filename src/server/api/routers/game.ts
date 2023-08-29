import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const gameRouter = createTRPCRouter({
  createGame: publicProcedure
    .input(
      z.object({
        data: z.object({
          name: z.string(),
          mapSrc: z.string(),
          mapPosX: z.number(),
          mapPosY: z.number(),
          dungeonMaster: z.string(),
        }),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.create({
        data: {
          ...input,
        },
      });
    }),
});
