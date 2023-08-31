import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const characterSchema = z.object({
  name: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  imgSrc: z.string(),
  initiative: z.number(),
  controller: z.string(),
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

  // TO DO:
  // Get all characters in game
  // Change initiative of characters in game
  // Get initiative of characters in game
  // Change position of characters in game
  // Get positions of characters in game
});
