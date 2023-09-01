import { boolean, z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const userInGameSchema = z.object({ gameId: z.string(), userId: z.string() });

const gameSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  mapSrc: z.string(),
  mapPosX: z.number(),
  mapPosY: z.number(),
  isPaused: z.boolean(),
  dungeonMaster: z.string(),
});

export const gameRouter = createTRPCRouter({
  // Upload game data to database. DOES NOT INCLUDE CHARACTERS
  createGame: publicProcedure.input(gameSchema).mutation(({ ctx, input }) => {
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

  // Add user to userInGame table
  connectUserToGame: publicProcedure
    .input(z.array(userInGameSchema))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.userInGame.createMany({
        data: input,
      });
    }),

  // TO DO:
  // Get map position
  // Change map position
  // Get map src
  // Change map src
});
