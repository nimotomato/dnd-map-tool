import { boolean, z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const userInGameSchema = z.object({ gameId: z.string(), userIds: z.array(z.string()) });

const gameSchema = z.object({
  gameId: z.string(),
  name: z.string(),
  mapSrc: z.string(),
  mapPosX: z.number(),
  mapPosY: z.number(),
  mapZoom: z.number(),
  spriteSize: z.number(),
  isPaused: z.boolean(),
  dungeonMasterId: z.string(),
});

export const gameRouter = createTRPCRouter({
  // Upload game data to database. DOES NOT INCLUDE CHARACTERS
  createGame: publicProcedure.input(gameSchema).mutation(({ctx, input}) => {
    return ctx.prisma.game.create({
      data: input,
    })
  }),

  // Add user to userInGame table
  connectUserToGame: publicProcedure
    .input(userInGameSchema)
    .mutation(({ ctx, input }) => {
      const ids = input.userIds.map((id) => ({gameId: input.gameId, userId: id}))

      return ctx.prisma.userInGame.createMany({
        data: ids,
      });
    }),

  // TO DO:
  // Get map position
  // Change map position
  // Get map src
  // Change map src
});
