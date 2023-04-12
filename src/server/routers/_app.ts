import { prisma } from "@src/lib/prisma";
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { Label, Status } from "@prisma/client";
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
  getInbox: publicProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        friendId: ctx.auth.userId,
      },
      include: {
        likes: true,
        bookmarks: true,
        author: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }),
  getLikes: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      return await prisma.post.findMany({
        where: {
          authorId: input ?? ctx.auth.userId,
        },
        select: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });
    }),
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const [sending, recieving] = await prisma.$transaction([
      prisma.friend.findMany({
        where: {
          senderId: ctx.auth.userId,
        },
        include: {
          receiver: true,
        },
      }),
      prisma.friend.findMany({
        where: {
          receiverId: ctx.auth.userId,
        },
        include: {
          sender: true,
        },
      }),
    ]);
    return [
      ...sending.map((friend) => ({
        friend: friend.receiver,
        createdAt: friend.createdAt,
      })),
      ...recieving.map((friend) => ({
        friend: friend.sender,
        createdAt: friend.createdAt,
      })),
    ].sort((a, b) => {
      if (a.createdAt > b.createdAt) return 1;
      if (a.createdAt < b.createdAt) return -1;
      return 0;
    });
  }),
  getAllFriends: protectedProcedure.query(async ({ ctx }) => {
    const [sending, recieving] = await prisma.$transaction([
      prisma.friend.findMany({
        where: {
          senderId: ctx.auth.userId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      }),
      prisma.friend.findMany({
        where: {
          receiverId: ctx.auth.userId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      }),
    ]);
    return sending.concat(recieving).sort((a, b) => {
      if (a.createdAt > b.createdAt) return 1;
      if (a.createdAt < b.createdAt) return -1;
      return 0;
    });
  }),
  getSendingFriendStatus: protectedProcedure
    .input(String)
    .query(async ({ input, ctx }) => {
      return await prisma.friend.findUnique({
        where: {
          receiverId_senderId: {
            senderId: ctx.auth.userId,
            receiverId: input,
          },
        },
      });
    }),
  getRecievingFriendStatus: protectedProcedure
    .input(String)
    .query(async ({ input, ctx }) => {
      return await prisma.friend.findUnique({
        where: {
          receiverId_senderId: {
            senderId: input,
            receiverId: ctx.auth.userId,
          },
        },
      });
    }),
  getBookmarks: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      return await prisma.post.findMany({
        where: {
          authorId: input ?? ctx.auth.userId,
        },
        select: {
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
      });
    }),
  getProfile: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      return await prisma.profile.findUnique({
        where: {
          id: input ?? ctx.auth.userId,
        },
      });
    }),
  getProfilePosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        authorId: ctx.auth.userId,
      },
      include: {
        likes: true,
        bookmarks: true,
        author: true,
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
        author: true,
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
        author: true,
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
        authorId: z.string(),
        friendId: z.string().optional(),
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
          author: {
            connect: {
              id: input.authorId,
            },
          },
          friend: {
            connect: {
              id: input.friendId,
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
  createFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        recieverId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.create({
        data: {
          senderId: input.senderId,
          receiverId: input.recieverId,
        },
      });
    }),
  updateFriendStatus: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        recieverId: z.string(),
        status: z.nativeEnum(Status),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.update({
        data: {
          status: input.status,
        },
        where: {
          receiverId_senderId: {
            senderId: input.senderId,
            receiverId: input.recieverId,
          },
        },
      });
    }),
  deleteFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        recieverId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.delete({
        where: {
          receiverId_senderId: {
            senderId: input.senderId,
            receiverId: input.recieverId,
          },
        },
      });
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
