import { prisma } from "@src/lib/prisma";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
export const appRouter = router({
  getUser: publicProcedure.query(({ ctx }) => {
    console.log("username", ctx.auth?.user?.username);
    return {
      greeting: `hello! ${ctx.auth?.user?.username}`,
    };
  }),
  posts: publicProcedure.query(async () => {
    return await prisma.post.findMany({
      include: {
        likes: true,
        bookmarks: true,
      },
    });
  }),
  createPost: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        authorName: z.string(),
        authorUsername: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.create({
        data: {
          title: input.title,
          description: input.description,
          authorName: input.authorName,
          authorUsername: input.authorUsername,
          stat: 27,
        },
      });
    }),
  updatePost: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.update({
        data: {
          title: input.title,
        },
        where: {
          id: input.id,
        },
      });
    }),
  deletePost: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.delete({
        where: {
          id: input.id,
        },
      });
    }),
  createLike: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        author: z.string(),
        postId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.like.create({
        data: {
          author: input.author,
          postId: input.postId,
        },
      });
    }),
  deleteLike: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.like.delete({
        where: {
          id: input.id,
        },
      });
    }),
  createBookmark: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        author: z.string(),
        postId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.bookmark.create({
        data: {
          author: input.author,
          postId: input.postId,
        },
      });
    }),
  deleteBookmark: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.bookmark.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
