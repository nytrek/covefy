import { z } from "zod";
import { prisma } from "@src/lib/prisma";
import { procedure, router } from "../trpc";
export const appRouter = router({
  posts: procedure.query(async () => {
    return await prisma.post.findMany({
      include: {
        author: true,
        booksmarks: true,
      },
    });
  }),
  createPost: procedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        title: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.create({
        data: {
          title: input.title,
          authorId: 2,
          like: 16,
          stat: 27,
          bookmark: 9,
        },
      });
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
