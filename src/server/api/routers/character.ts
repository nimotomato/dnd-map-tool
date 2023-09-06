import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const characterSchema = z.object({
  name: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  imgSrc: z.string(),
  initiative: z.number(),
  controllerId: z.string(),
  gameId: z.string(),
});

const characterArraySchema = z.array(characterSchema);

export const characterRouter = createTRPCRouter({
  // Upload characters to database.
  createCharacters: publicProcedure
    .input(characterArraySchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.character.createMany({
        data: input,
      });
    }),

  getCharactersInGame: publicProcedure
    .input(z.object({ gameId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.character.findMany({
        where: {
          gameId: {
            equals: input.gameId,
          },
        },
      });
    }),

  updateInitiative: publicProcedure
    .input(
      z.array(z.object({ characterId: z.string(), initiative: z.number() }))
    )
    .mutation(({ ctx, input }) => {
      const initiatives = input.map((char) => {
        return ctx.prisma.character.update({
          where: {
            characterId: char.characterId,
          },
          data: {
            initiative: char.initiative,
          },
        });
      });

      return ctx.prisma.$transaction(initiatives);
    }),
});
