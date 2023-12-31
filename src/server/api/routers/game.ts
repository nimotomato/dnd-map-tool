import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const characterSchema = z.array(
  z.object({
    characterId: z.string(),
    name: z.string(),
    imgSrc: z.string(),
    controllerId: z.string(),
    dexModifier: z.number(),
  })
);

const characterInGameSchema = z.array(
  z.object({
    characterId: z.string(),
    gameId: z.string(),
    positionX: z.number(),
    positionY: z.number(),
    prevPositionX: z.number(),
    prevPositionY: z.number(),
    initiative: z.number(),
    isDead: z.boolean(),
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
  turnIndex: z.number(),
  leashDistance: z.number(),
});

const newGameSchema = z.object({
  gameData: gameSchema,
  characterData: characterSchema,
  userIds: z.array(z.string()),
  charInGameData: characterInGameSchema,
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
          Game: true,
        },
      });
    }),

  getStartingMapPosition: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.game.findMany({
        where: {
          gameId: {
            equals: input.gameId,
          },
        },
        select: {
          mapPosX: true,
          mapPosY: true,
        },
      });
    }),

  postNewGame: publicProcedure
    .input(newGameSchema)
    .mutation(({ ctx, input }) => {
      const gameUserIds = input.userIds.map((id) => ({
        gameId: input.gameData.gameId,
        userId: id,
      }));

      const gameIds = ctx.prisma.userInGame.createMany({
        data: gameUserIds,
      });

      const game = ctx.prisma.game.create({
        data: input.gameData,
      });

      const characters = ctx.prisma.character.createMany({
        data: input.characterData,
      });

      const charactersInGameId = input.charInGameData.map((character) => ({
        gameId: input.gameData.gameId,
        characterId: character.characterId,
        positionX: character.positionX,
        positionY: character.positionY,
        prevPositionX: character.prevPositionX,
        prevPositionY: character.prevPositionY,
        initiative: character.initiative,
        isDead: character.isDead,
      }));

      const charactersInGame = ctx.prisma.characterInGame.createMany({
        data: charactersInGameId,
      });

      return prisma.$transaction([gameIds, game, characters, charactersInGame]);
    }),

  patchGamePause: publicProcedure
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

  patchGameUnpause: publicProcedure
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

  patchMapPosition: publicProcedure
    .input(
      z.object({ gameId: z.string(), mapPosX: z.number(), mapPosY: z.number() })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.update({
        where: {
          gameId: input.gameId,
        },
        data: {
          mapPosX: input.mapPosX,
          mapPosY: input.mapPosY,
        },
      });
    }),

  patchTurnIndex: publicProcedure
    .input(z.object({ gameId: z.string(), turnIndex: z.number() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.game.update({
        where: {
          gameId: input.gameId,
        },
        data: {
          turnIndex: input.turnIndex,
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
