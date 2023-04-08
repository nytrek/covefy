import { prisma } from "@src/lib/prisma";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { Label } from "@prisma/client";
export const appRouter = router({
  getUserPosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        authorId: ctx.auth.userId,
      },
      include: {
        likes: true,
        bookmarks: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }),
  getPublicPosts: publicProcedure.query(async () => {
    return await prisma.post.findMany({
      where: {
        label: "PUBLIC",
      },
      include: {
        likes: true,
        bookmarks: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }),
  getBookmarkedPosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        bookmarks: {
          some: {
            authorId: ctx.auth.userId,
          },
        },
      },
      include: {
        likes: true,
        bookmarks: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }),
  createPost: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        title: z.string(),
        label: z.nativeEnum(Label),
        description: z.string(),
        authorId: z.string(),
        authorName: z.string(),
        authorUsername: z.string(),
        authorProfileImageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.create({
        data: {
          title: input.title,
          label: input.label,
          description: input.description,
          authorId: input.authorId,
          authorName: input.authorName,
          authorUsername: input.authorUsername,
          authorProfileImageUrl: input.authorProfileImageUrl,
        },
      });
    }),
  updatePost: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        label: z.nativeEnum(Label),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.update({
        data: {
          title: input.title,
          label: input.label,
          description: input.description,
        },
        where: {
          id: input.id,
        },
      });
    }),
  deletePost: protectedProcedure
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
  createLike: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        postId: z.number(),
        authorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.like.create({
        data: {
          postId: input.postId,
          authorId: input.authorId,
        },
      });
    }),
  deleteLike: protectedProcedure
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
  createBookmark: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        postId: z.number(),
        authorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.bookmark.create({
        data: {
          postId: input.postId,
          authorId: input.authorId,
        },
      });
    }),
  deleteBookmark: protectedProcedure
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
