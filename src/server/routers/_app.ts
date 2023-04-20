import { Label, Status } from "@prisma/client";
import { prisma } from "@src/lib/prisma";
import deleteFile from "@src/lib/upload";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Configuration, OpenAIApi } from "openai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

const ratelimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "20 s"),
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const date = new Date();
const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const appRouter = router({
  getPost: publicProcedure.input(Number).query(async ({ input }) => {
    return await prisma.post.findUnique({
      where: {
        id: input,
      },
      include: {
        likes: true,
        bookmarks: true,
        author: true,
        friend: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });
  }),
  getProfile: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.profile.findUnique({
        where: {
          id: input ?? ctx.auth.userId,
        },
      });
    }),
  getInbox: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    const [sending, recieving] = await prisma.$transaction([
      prisma.post.findMany({
        where: {
          authorId: ctx.auth.userId,
          friendId: {
            startsWith: "user",
          },
        },
        include: {
          likes: true,
          bookmarks: true,
          author: true,
          friend: true,
          comments: {
            include: {
              author: true,
            },
          },
        },
      }),
      prisma.post.findMany({
        where: {
          friendId: ctx.auth.userId,
        },
        include: {
          likes: true,
          bookmarks: true,
          author: true,
          friend: true,
          comments: {
            include: {
              author: true,
            },
          },
        },
      }),
    ]);
    return sending.concat(recieving).sort((a, b) => {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return 0;
    });
  }),
  getRanking: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return await prisma.post.findMany({
      where: {
        label: "PUBLIC",
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        author: true,
        likes: true,
        comments: true,
        bookmarks: true,
      },
      orderBy: [
        {
          likes: {
            _count: "desc",
          },
        },
        {
          comments: {
            _count: "desc",
          },
        },
        {
          bookmarks: {
            _count: "desc",
          },
        },
      ],
      take: 8,
    });
  }),
  getBanners: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return await prisma.banner.findMany({
      orderBy: {
        id: "asc",
      },
      include: {
        purchases: {
          where: {
            profileId: ctx.auth.userId,
          },
        },
      },
    });
  }),
  getProfileBanners: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return await prisma.banner.findMany({
      where: {
        purchases: {
          some: {
            profileId: ctx.auth.userId,
          },
        },
      },
      orderBy: {
        id: "asc",
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
        friend: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  getProfilePosts: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return await prisma.post.findMany({
      where: {
        authorId: ctx.auth.userId,
      },
      include: {
        likes: true,
        bookmarks: true,
        author: true,
        friend: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  getBookmarkedPosts: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
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
        friend: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
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
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return 0;
    });
  }),
  getAllFriends: protectedProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    const [sending, recieving] = await prisma.$transaction([
      prisma.friend.findMany({
        where: {
          senderId: ctx.auth.userId,
        },
        include: {
          sender: {
            include: {
              posts: true,
            },
          },
          receiver: {
            include: {
              posts: true,
            },
          },
        },
      }),
      prisma.friend.findMany({
        where: {
          receiverId: ctx.auth.userId,
        },
        include: {
          sender: {
            include: {
              posts: true,
            },
          },
          receiver: {
            include: {
              posts: true,
            },
          },
        },
      }),
    ]);
    return sending.concat(recieving).sort((a, b) => {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return 0;
    });
  }),
  getSendingFriendStatus: protectedProcedure
    .input(String)
    .query(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
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
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.friend.findUnique({
        where: {
          receiverId_senderId: {
            senderId: input,
            receiverId: ctx.auth.userId,
          },
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
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
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
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.friend.update({
        data: {
          status: input.status,
          updatedAt: new Date(),
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
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.friend.delete({
        where: {
          receiverId_senderId: {
            senderId: input.senderId,
            receiverId: input.recieverId,
          },
        },
      });
    }),
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        label: z.nativeEnum(Label),
        description: z.string(),
        attachment: z.string().nullish(),
        attachmentPath: z.string().nullish(),
        authorId: z.string(),
        friendId: z.string().optional(),
        credits: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return input.friendId
        ? await prisma.$transaction([
            prisma.post.create({
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
            }),
            prisma.profile.update({
              data: {
                credits: input.credits,
              },
              where: {
                id: ctx.auth.userId,
              },
            }),
          ])
        : await prisma.$transaction([
            prisma.post.create({
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
              },
            }),
            prisma.profile.update({
              data: {
                credits: input.credits,
              },
              where: {
                id: ctx.auth.userId,
              },
            }),
          ]);
    }),
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        label: z.nativeEnum(Label),
        description: z.string(),
        attachment: z.string().nullish(),
        attachmentPath: z.string().nullish(),
        friendId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return input.friendId
        ? await prisma.post.update({
            data: {
              title: input.title,
              label: input.label,
              description: input.description,
              attachment: input.attachment,
              attachmentPath: input.attachmentPath,
              friend: {
                connect: {
                  id: input.friendId,
                },
              },
            },
            where: {
              id: input.id,
            },
          })
        : await prisma.post.update({
            data: {
              title: input.title,
              label: input.label,
              description: input.description,
              attachment: input.attachment,
              attachmentPath: input.attachmentPath,
            },
            where: {
              id: input.id,
            },
          });
    }),
  deletePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.post.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getLikes: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
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
  createLike: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.like.create({
        data: {
          postId: input.postId,
          profileId: input.profileId,
        },
      });
    }),
  deleteLike: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.like.delete({
        where: {
          postId_profileId: {
            postId: input.postId,
            profileId: input.profileId,
          },
        },
      });
    }),
  getBookmarks: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
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
  createBookmark: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.bookmark.create({
        data: {
          postId: input.postId,
          profileId: input.profileId,
        },
      });
    }),
  deleteBookmark: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.bookmark.delete({
        where: {
          postId_profileId: {
            postId: input.postId,
            profileId: input.profileId,
          },
        },
      });
    }),
  getComments: protectedProcedure
    .input(z.string().optional())
    .query(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.post.findMany({
        where: {
          authorId: input ?? ctx.auth.userId,
          comments: {
            every: {
              authorId: {
                not: {
                  equals: input ?? ctx.auth.userId,
                },
              },
            },
          },
        },
        select: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });
    }),
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        comment: z.string(),
        credits: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.$transaction([
        prisma.comment.create({
          data: {
            postId: input.postId,
            comment: input.comment,
            authorId: ctx.auth.userId,
          },
        }),
        prisma.profile.update({
          data: {
            credits: input.credits,
          },
          where: {
            id: ctx.auth.userId,
          },
        }),
      ]);
    }),
  deleteComment: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.comment.delete({
        where: {
          id: input.id,
        },
      });
    }),
  createPurchase: protectedProcedure
    .input(
      z.object({
        bannerId: z.number(),
        profileId: z.string(),
        credits: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.$transaction([
        prisma.purchase.create({
          data: {
            bannerId: input.bannerId,
            profileId: input.profileId,
          },
        }),
        prisma.profile.update({
          data: {
            credits: input.credits,
          },
          where: {
            id: input.profileId,
          },
        }),
      ]);
    }),
  updateProfileBanner: protectedProcedure
    .input(
      z.object({
        banner: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await prisma.profile.update({
        data: {
          banner: input.banner,
        },
        where: {
          id: ctx.auth.userId,
        },
      });
    }),
  deleteAttachment: protectedProcedure
    .input(
      z.object({
        attachmentPath: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      return await deleteFile({
        accountId: process.env.UPLOAD_ACCOUNTID,
        apiKey: process.env.UPLOAD_SECRETKEY,
        querystring: {
          filePath: input.attachmentPath,
        },
      });
    }),
  deleteProfile: protectedProcedure.mutation(async ({ ctx }) => {
    const { success } = await ratelimiter.limit(ctx.auth.userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return await fetch("https://api.clerk.com/v1/users/" + ctx.auth.userId, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + process.env.CLERK_SECRET_KEY,
      },
    });
  }),
  generateAIResponse: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        credits: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { success } = await ratelimiter.limit(ctx.auth.userId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt:
          "Respond to the following prompt with a maximum of 480 characters - " +
          input.prompt,
        temperature: 0.6,
        max_tokens: 480,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      await prisma.profile.update({
        data: {
          credits: input.credits,
        },
        where: {
          id: ctx.auth.userId,
        },
      });
      return completion.data.choices[0].text;
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
