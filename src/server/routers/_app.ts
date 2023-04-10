import { prisma } from "@src/lib/prisma";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { Label } from "@prisma/client";
async function deleteFile(params: any) {
  const baseUrl = "https://api.upload.io";
  const path = `/v2/accounts/${params.accountId}/files`;
  const entries = (obj: any) =>
    Object.entries(obj).filter(([, val]) => (val ?? null) !== null);
  const query = entries(params.querystring ?? {})
    .flatMap(([k, v]) => (Array.isArray(v) ? v.map((v2) => [k, v2]) : [[k, v]]))
    .map((kv) => kv.join("="))
    .join("&");
  const response = await fetch(
    `${baseUrl}${path}${query.length > 0 ? "?" : ""}${query}`,
    {
      method: "DELETE",
      headers: Object.fromEntries(
        entries({
          Authorization: `Bearer ${params.apiKey}`,
        }) as any
      ),
    }
  );
  if (Math.floor(response.status / 100) !== 2) {
    const result = await response.json();
    throw new Error(`Upload API Error: ${JSON.stringify(result)}`);
  }
}
export const appRouter = router({
  getLikes: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.like.count({
      where: {
        profileId: ctx.auth.userId,
      },
    });
  }),
  getBookmarks: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.bookmark.count({
      where: {
        profileId: ctx.auth.userId,
      },
    });
  }),
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.profile.findUnique({
      where: {
        id: ctx.auth.userId,
      },
    });
  }),
  getProfilePosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        profileId: ctx.auth.userId,
      },
      include: {
        likes: true,
        bookmarks: true,
        profile: true,
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
        profile: true,
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
            profileId: ctx.auth.userId,
          },
        },
      },
      include: {
        likes: true,
        bookmarks: true,
        profile: true,
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
        attachment: z.string().nullish(),
        attachmentPath: z.string().nullish(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.post.create({
        data: {
          title: input.title,
          label: input.label,
          description: input.description,
          attachment: input.attachment,
          attachmentPath: input.attachmentPath,
          profile: {
            connect: {
              id: input.profileId,
            },
          },
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
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.like.create({
        data: {
          postId: input.postId,
          profileId: input.profileId,
        },
      });
    }),
  deleteLike: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.like.delete({
        where: {
          postId_profileId: {
            postId: input.postId,
            profileId: input.profileId,
          },
        },
      });
    }),
  createBookmark: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.bookmark.create({
        data: {
          postId: input.postId,
          profileId: input.profileId,
        },
      });
    }),
  deleteBookmark: protectedProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here some login stuff would happen
      return await prisma.bookmark.delete({
        where: {
          postId_profileId: {
            postId: input.postId,
            profileId: input.profileId,
          },
        },
      });
    }),
  deleteAttachment: protectedProcedure
    .input(
      z.object({
        attachmentPath: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await deleteFile({
        accountId: process.env.UPLOAD_ACCOUNTID,
        apiKey: process.env.UPLOAD_SECRETKEY,
        querystring: {
          filePath: input.attachmentPath,
        },
      });
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
