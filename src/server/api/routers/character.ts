import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const characterSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  imgSrc: z.string(),
  initiative: z.number(),
  controllerId: z.string(),
});

const characterInGameSchema = z.object({
  characterId: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  initiative: z.number(),
  gameId: z.string(),
  isDead: z.boolean(),
});

const characterArraySchema = z.array(characterSchema);

const putCharacterSchema = z.object({
  characterId: z.string(),
  name: z.string(),
  imgSrc: z.string(),
  controllerId: z.string(),
});

export const characterRouter = createTRPCRouter({
  postCharacter: publicProcedure
    .input(putCharacterSchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.character.create({
        data: input,
      });
    }),

  // Upload characters to database.
  postCharacters: publicProcedure
    .input(characterArraySchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.character.createMany({
        data: input,
      });
    }),

  postCharacterInGame: publicProcedure
    .input(characterInGameSchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.characterInGame.createMany({
        data: input,
      });
    }),

  getCharactersInGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.characterInGame.findMany({
        where: {
          gameId: {
            equals: input.gameId,
          },
        },
        select: {
          characterId: true,
          initiative: true,
          positionX: true,
          positionY: true,
          isDead: true,
          Character: true,
        },
      });
    }),

  getGamesOfCharacters: publicProcedure
    .input(z.object({ characterId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.characterInGame.findMany({
        where: {
          characterId: input.characterId,
        },
        select: {
          Game: true,
        },
      });
    }),

  getCharactersOfUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.character.findMany({
        where: {
          controllerId: input.userId,
        },
      });
    }),

  getCharactersOfUserWithGameId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.characterInGame.findMany({
        where: {
          Character: {
            controllerId: input.userId,
          },
        },
        select: {
          gameId: true,
          Character: true,
        },
      });
    }),

  patchInitiative: publicProcedure
    .input(
      z.array(
        z.object({
          characterId: z.string(),
          gameId: z.string(),
          initiative: z.number(),
        })
      )
    )
    .mutation(({ ctx, input }) => {
      const initiatives = input.map((char) => {
        return ctx.prisma.characterInGame.update({
          where: {
            gameId_characterId: {
              characterId: char.characterId,
              gameId: char.gameId,
            },
          },
          data: {
            initiative: char.initiative,
          },
        });
      });

      return ctx.prisma.$transaction(initiatives);
    }),

  putCharacterInGame: publicProcedure
    .input(characterSchema.extend({ gameId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.characterInGame.update({
        where: {
          gameId_characterId: {
            characterId: input.characterId,
            gameId: input.gameId,
          },
        },
        data: {
          positionX: input.positionX,
          positionY: input.positionY,
          initiative: input.initiative,
        },
      });
    }),

  deleteCharacter: publicProcedure
    .input(z.object({ characterId: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.character.delete({
        where: {
          characterId: input.characterId,
        },
      });
    }),
});
