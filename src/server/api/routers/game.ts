import { boolean, z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const userInGameSchema = z.object({
  gameId: z.string(),
  userIds: z.array(z.string()),
});

const characterSchema = z.array(
  z.object({
    name: z.string(),
    positionX: z.number(),
    positionY: z.number(),
    imgSrc: z.string(),
    initiative: z.number(),
    controllerId: z.string(),
    gameId: z.string(),
  })
);

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

const newGameSchema = z.object({
  gameData: gameSchema,
  characterData: characterSchema,
  userIds: z.array(z.string()),
});

export const gameRouter = createTRPCRouter({
  // Upload game data to database. DOES NOT INCLUDE CHARACTERS
  createGame: publicProcedure.input(gameSchema).mutation(({ ctx, input }) => {
    return ctx.prisma.game.create({
      data: input,
    });
  }),

  // Add user to userInGame table
  connectUserToGame: publicProcedure
    .input(userInGameSchema)
    .mutation(({ ctx, input }) => {
      const ids = input.userIds.map((id) => ({
        gameId: input.gameId,
        userId: id,
      }));

      return ctx.prisma.userInGame.createMany({
        data: ids,
      });
    }),

  createNewGame: publicProcedure
    .input(newGameSchema)
    .mutation(({ ctx, input }) => {
      const ids = input.userIds.map((id) => ({
        gameId: input.gameData.gameId,
        userId: id,
      }));

      const gameIds = ctx.prisma.userInGame.createMany({
        data: ids,
      });

      const game = ctx.prisma.game.create({
        data: input.gameData,
      });

      const characters = ctx.prisma.character.createMany({
        data: input.characterData,
      });
      console.log("Preparing to insert:", gameIds, game, characters);

      return prisma.$transaction([gameIds, game, characters]);
    }),

  // TO DO:
  // Get map position
  // Change map position
  // Get map src
  // Change map src
});
