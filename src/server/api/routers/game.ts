import { boolean, z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const userInGameSchema = z.object({
  gameId: z.string(),
  userIds: z.array(z.string()),
});

const characterSchema = z.array(
  z.object({
    characterId: z.string(),
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
  getGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.game.findFirst({
        where: {
          gameId: {
            equals: input.gameId,
          },
        },
      });
    }),

  getGames: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.userInGame.findMany({
        where: {
          userId: {
            equals: input.userId,
          },
        },
        distinct: ["gameId"],
        select: {
          game: {
            select: {
              name: true,
              gameId: true,
              dungeonMasterId: true,
            },
          },
        },
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

  pauseGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.update({
        where: {
          gameId: input.gameId,
        },
        data: {
          isPaused: true,
        },
      });
    }),

  unPauseGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.update({
        where: {
          gameId: input.gameId,
        },
        data: {
          isPaused: false,
        },
      });
    }),

  deleteGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.delete({
        where: {
          gameId: input.gameId,
        },
      });
    }),
});
