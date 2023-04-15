import { Label, Status } from "@prisma/client";
import { prisma } from "@src/lib/prisma";
import deleteFile from "@src/lib/upload";
import { Configuration, OpenAIApi } from "openai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const appRouter = router({
  getInbox: protectedProcedure.query(async ({ ctx }) => {
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
          comments: {
            include: {
              author: true,
            },
          },
        },
        orderBy: {
          id: "desc",
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
          comments: {
            include: {
              author: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),
    ]);
    return sending.concat(recieving).sort((a, b) => {
      if (a.createdAt > b.createdAt) return 1;
      if (a.createdAt < b.createdAt) return -1;
      return 0;
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
  getRanking: protectedProcedure.query(async () => {
    return await prisma.post.findMany({
      where: {
        label: "PUBLIC",
      },
      include: {
        author: true,
        bookmarks: true,
      },
      orderBy: {
        bookmarks: {
          _count: "desc",
        },
      },
      take: 8,
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
        comments: true,
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
        comments: true,
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
        comments: true,
      },
      orderBy: {
        id: "desc",
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
      })
    )
    .mutation(async ({ input }) => {
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
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.post.delete({
        where: {
          id: input.id,
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
  createLike: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      return await prisma.bookmark.delete({
        where: {
          postId_profileId: {
            postId: input.postId,
            profileId: input.profileId,
          },
        },
      });
    }),
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.comment.create({
        data: {
          postId: input.postId,
          comment: input.comment,
          authorId: ctx.auth.userId,
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
  generateAIResponse: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        credits: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
