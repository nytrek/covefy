import { Label, Status } from "@prisma/client";
import { prisma } from "@src/lib/prisma";
import deleteFile from "@src/lib/upload";
import { inferReactQueryProcedureOptions } from "@trpc/react-query";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { Configuration, OpenAIApi } from "openai";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const appRouter = router({
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
          "Respond to the following prompt with less than 480 characters - " +
          input.prompt,
        temperature: 0.8,
        max_tokens: 480,
        frequency_penalty: 0,
        presence_penalty: 0,
        user: ctx.auth.userId,
      });
      if (completion.data.choices[0].text) {
        await prisma.profile.update({
          data: {
            credits: input.credits,
          },
          where: {
            id: ctx.auth.userId,
          },
        });
      }
      return completion.data.choices[0].text;
    }),
  getBoard: protectedProcedure.input(z.number()).query(async ({ input }) => {
    return await prisma.board.findUnique({
      where: {
        id: input,
      },
      include: {
        posts: {
          where: {
            label: "PUBLIC",
          },
          include: {
            _count: true,
            board: true,
            author: true,
            friend: true,
            likes: {
              include: {
                profile: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            bookmarks: {
              include: {
                profile: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }),
  createBoard: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.board.create({
        data: {
          name: input.name,
          description: input.description,
          profileId: ctx.auth.userId,
        },
      });
    }),
  deleteBoard: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.board.delete({
        where: {
          id: input.id,
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
        include: {
          sender: {
            where: {
              status: "ACCEPTED",
              receiverId: ctx.auth.userId,
            },
          },
          receiver: {
            where: {
              status: "ACCEPTED",
              senderId: ctx.auth.userId,
            },
          },
          boards: true,
        },
      });
    }),
  updateProfile: protectedProcedure
    .input(z.object({ label: z.nativeEnum(Label) }))
    .mutation(async ({ input, ctx }) => {
      return await prisma.profile.update({
        data: {
          label: input.label,
        },
        where: {
          id: ctx.auth.userId,
        },
      });
    }),
  deleteProfile: protectedProcedure.mutation(async ({ ctx }) => {
    return await fetch("https://api.clerk.com/v1/users/" + ctx.auth.userId, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + process.env.CLERK_SECRET_KEY,
      },
    });
  }),
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const [sending, receiving] = await prisma.$transaction([
      prisma.friend.findMany({
        where: {
          status: "ACCEPTED",
          senderId: ctx.auth.userId,
        },
        include: {
          receiver: true,
        },
      }),
      prisma.friend.findMany({
        where: {
          status: "ACCEPTED",
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
      ...receiving.map((friend) => ({
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
    const [sending, receiving] = await prisma.$transaction([
      prisma.friend.findMany({
        where: {
          senderId: ctx.auth.userId,
        },
        include: {
          sender: {
            include: {
              posts: {
                where: {
                  label: "PUBLIC",
                },
                include: {
                  _count: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 4,
              },
            },
          },
          receiver: {
            include: {
              posts: {
                where: {
                  label: "PUBLIC",
                },
                include: {
                  _count: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 4,
              },
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
              posts: {
                where: {
                  label: "PUBLIC",
                },
                include: {
                  _count: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 4,
              },
            },
          },
          receiver: {
            include: {
              posts: {
                where: {
                  label: "PUBLIC",
                },
                include: {
                  _count: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 4,
              },
            },
          },
        },
      }),
    ]);
    return sending.concat(receiving).sort((a, b) => {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
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
  getReceivingFriendStatus: protectedProcedure
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
  createFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        receiverId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.create({
        data: {
          senderId: input.senderId,
          receiverId: input.receiverId,
        },
      });
    }),
  updateFriendStatus: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        receiverId: z.string(),
        status: z.nativeEnum(Status),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.update({
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
        where: {
          receiverId_senderId: {
            senderId: input.senderId,
            receiverId: input.receiverId,
          },
        },
      });
    }),
  deleteFriendRequest: protectedProcedure
    .input(
      z.object({
        senderId: z.string(),
        receiverId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.friend.delete({
        where: {
          receiverId_senderId: {
            senderId: input.senderId,
            receiverId: input.receiverId,
          },
        },
      });
    }),
  createLike: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
        popularity: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction([
        prisma.like.create({
          data: {
            postId: input.postId,
            profileId: ctx.auth.userId,
          },
        }),
        prisma.profile.update({
          data: {
            popularity: input.popularity,
          },
          where: {
            id: input.profileId,
          },
        }),
      ]);
    }),
  deleteLike: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
        popularity: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction([
        prisma.like.delete({
          where: {
            postId_profileId: {
              postId: input.postId,
              profileId: ctx.auth.userId,
            },
          },
        }),
        prisma.profile.update({
          data: {
            popularity: input.popularity,
          },
          where: {
            id: input.profileId,
          },
        }),
      ]);
    }),
  createBookmark: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
        popularity: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction([
        prisma.bookmark.create({
          data: {
            postId: input.postId,
            profileId: ctx.auth.userId,
          },
        }),
        prisma.profile.update({
          data: {
            popularity: input.popularity,
          },
          where: {
            id: input.profileId,
          },
        }),
      ]);
    }),
  deleteBookmark: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        profileId: z.string(),
        popularity: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await prisma.$transaction([
        prisma.bookmark.delete({
          where: {
            postId_profileId: {
              postId: input.postId,
              profileId: ctx.auth.userId,
            },
          },
        }),
        prisma.profile.update({
          data: {
            popularity: input.popularity,
          },
          where: {
            id: input.profileId,
          },
        }),
      ]);
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
    .mutation(async ({ input }) => {
      return await prisma.comment.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getPost: publicProcedure.input(Number).query(async ({ input }) => {
    return await prisma.post.findUnique({
      where: {
        id: input,
      },
      include: {
        _count: true,
        board: true,
        author: true,
        friend: true,
        likes: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
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
        boardId: z.number().optional(),
        authorId: z.string(),
        friendId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const board = input.boardId
        ? {
            connect: {
              id: input.boardId,
            },
          }
        : undefined;
      const friend = input.friendId
        ? {
            connect: {
              id: input.friendId,
            },
          }
        : undefined;
      return await prisma.post.create({
        data: {
          title: input.title,
          label: input.label,
          description: input.description,
          attachment: input.attachment,
          attachmentPath: input.attachmentPath,
          board,
          author: {
            connect: {
              id: input.authorId,
            },
          },
          friend,
        },
      });
    }),
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        label: z.nativeEnum(Label),
        description: z.string(),
        pinned: z.boolean(),
        attachment: z.string().nullish(),
        attachmentPath: z.string().nullish(),
        friendId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const friend = input.friendId
        ? {
            connect: {
              id: input.friendId,
            },
          }
        : {
            disconnect: true,
          };
      return await prisma.post.update({
        data: {
          title: input.title,
          label: input.label,
          description: input.description,
          pinned: input.pinned,
          attachment: input.attachment,
          attachmentPath: input.attachmentPath,
          friend,
          updatedAt: new Date(),
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
        attachmentPath: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.attachmentPath) {
        await deleteFile({
          accountId: process.env.UPLOAD_ACCOUNTID,
          apiKey: process.env.UPLOAD_SECRETKEY,
          querystring: {
            filePath: input.attachmentPath,
          },
        });
      }
      return await prisma.post.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getDefaultPosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        board: null,
        label: "PUBLIC",
        authorId: ctx.auth.userId,
      },
      include: {
        _count: true,
        board: true,
        author: true,
        friend: true,
        likes: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),
  getPinnedPosts: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.post.findMany({
      where: {
        pinned: true,
        authorId: ctx.auth.userId,
      },
      include: {
        _count: true,
        board: true,
        author: true,
        friend: true,
        likes: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),
  getPublicPosts: publicProcedure.query(async () => {
    return await prisma.post.findMany({
      where: {
        label: "PUBLIC",
      },
      include: {
        _count: true,
        board: true,
        author: true,
        friend: true,
        likes: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            profile: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
