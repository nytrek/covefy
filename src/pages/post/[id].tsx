import { useUser } from "@clerk/nextjs";
import { Menu, Transition } from "@headlessui/react";
import {
  BookmarkIcon as BookmarkIconSolid,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconSolid,
  CheckBadgeIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  HandThumbUpIcon as HandThumbUpIconSolid,
} from "@heroicons/react/20/solid";
import {
  BookmarkIcon as BookmarkIconOutline,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconOutline,
  HandThumbUpIcon as HandThumbUpIconOutline,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, Fragment, useState } from "react";
import { toast } from "react-hot-toast";

const MAX_TOKENS = 720;
const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

type Post = Prisma.PostGetPayload<{
  include: {
    likes: true;
    bookmarks: true;
    author: true;
    friend: true;
    comments: {
      include: {
        author: true;
      };
    };
  };
}>;

function Dropdown({ item }: { item: Post }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full bg-brand-100 text-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-100">
          {item.author?.imageUrl ? (
            <img
              className="h-10 w-10 rounded-full"
              src={item.author?.imageUrl}
              alt=""
            />
          ) : (
            <span className="block h-10 w-10 rounded-full bg-brand-700"></span>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={"/profile/" + item.authorId}
                  className={clsx(
                    active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                    "block px-4 py-2 text-sm"
                  )}
                >
                  View profile
                </Link>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function Like({ item }: { item: Post }) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const createLike = trpc.createLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post liked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const deleteLike = trpc.deleteLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post unliked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnCreateLike = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createLike.mutate({
      postId: id,
      profileId: user.id,
    });
  };
  const handleOnDeleteLike = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    deleteLike.mutate({
      postId: id,
      profileId: user.id,
    });
  };
  return (
    <div className="inline-flex items-center text-sm">
      <button
        type="button"
        onClick={() => {
          !!item.likes.find((post) => post.profileId === user?.id)
            ? handleOnDeleteLike(item.id)
            : handleOnCreateLike(item.id);
        }}
        className="inline-flex space-x-2"
      >
        {item.likes.find((like) => like.profileId === user?.id) ? (
          <HandThumbUpIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <HandThumbUpIconOutline className="h-5 w-5" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={item.likes.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {item.likes.length}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">likes</span>
      </button>
    </div>
  );
}

function Comment({ item }: { item: Post }) {
  const { user } = useUser();
  return (
    <span className="inline-flex items-center text-sm">
      <button type="button" className="inline-flex space-x-2">
        {item.comments.find((comment) => comment.authorId === user?.id) ? (
          <ChatBubbleOvalLeftIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ChatBubbleOvalLeftIconOutline
            className="h-5 w-5"
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={item.comments.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {item.comments.length}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">comments</span>
      </button>
    </span>
  );
}

function Bookmark({ item }: { item: Post }) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const createBookmark = trpc.createBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post bookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const deleteBookmark = trpc.deleteBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post unbookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnCreateBookmark = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createBookmark.mutate({
      postId: id,
      profileId: user.id,
    });
  };
  const handleOnDeleteBookmark = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    deleteBookmark.mutate({
      postId: id,
      profileId: user.id,
    });
  };
  return (
    <span className="inline-flex items-center text-sm">
      <button
        type="button"
        onClick={() => {
          !!item.bookmarks.find((post) => post.profileId === user?.id)
            ? handleOnDeleteBookmark(item.id)
            : handleOnCreateBookmark(item.id);
        }}
        className="inline-flex space-x-2"
      >
        {item.bookmarks.find((bookmark) => bookmark.profileId === user?.id) ? (
          <BookmarkIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <BookmarkIconOutline className="h-5 w-5" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={item.bookmarks.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {item.bookmarks.length}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">bookmarks</span>
      </button>
    </span>
  );
}

function BookmarkCheck({ item }: { item: Post }) {
  const { user } = useUser();
  return (
    <div>
      <AnimatePresence mode="wait">
        {item.bookmarks.find((bookmark) => bookmark.profileId === user?.id) ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex text-sm"
          >
            <span className="inline-flex items-center text-sm">
              <button type="button" className="inline-flex space-x-2">
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Bookmarked</span>
              </button>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Comments({ item }: { item: Post }) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const deleteComment = trpc.deleteComment.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Comment deleted!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  return (
    <ul role="list" className="space-y-6">
      <AnimatePresence>
        {item.comments.map((comment) => (
          <motion.li
            key={comment.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative flex gap-x-4"
          >
            {item.authorId === user?.id || comment.authorId === user?.id ? (
              <Menu
                as="div"
                className="absolute inset-0 inline-block text-left"
              >
                <div>
                  <Menu.Button className="absolute inset-0"></Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() =>
                              deleteComment.mutate({ id: comment.id })
                            }
                            className={clsx(
                              active
                                ? "bg-brand-100 text-brand-900"
                                : "text-brand-700",
                              "block w-full px-4 py-2 text-left text-sm"
                            )}
                          >
                            Delete comment
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : null}
            {comment.author.imageUrl ? (
              <img
                src={comment.author.imageUrl}
                alt=""
                className="relative h-6 w-6 flex-none rounded-full bg-brand-700"
              />
            ) : (
              <span className="relative mt-3 h-6 w-6 flex-none rounded-full bg-brand-700"></span>
            )}
            <div className="flex-auto rounded-md">
              <div className="flex justify-between gap-x-4">
                <div className="py-0.5 text-xs leading-5 text-brand-50">
                  <span className="font-medium text-brand-50">
                    {comment.author.name}
                  </span>{" "}
                  commented
                </div>
                <time
                  dateTime={comment.createdAt.toString()}
                  className="flex-none py-0.5 text-xs leading-5 text-brand-50"
                >
                  {formatDistanceToNow(comment.createdAt, {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <p className="text-sm leading-6 text-brand-50">
                {comment.comment}
              </p>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function CommentBox({ item }: { item: Post }) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const [length, setLength] = useState(0);
  const profile = trpc.getProfile.useQuery();
  const createComment = trpc.createComment.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getPost.invalidate();
      utils.getProfile.invalidate();
      toast.success("Comment created!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnCreateComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !profile.data) return;
    if (profile.data.credits < 1)
      return toast.error("You don't have enough credits");
    const target = e.target as typeof e.target & {
      reset: () => void;
      comment: { id: string; value: string };
    };
    toast.loading("Loading");
    createComment.mutate(
      {
        postId: Number(target.comment.id),
        comment: target.comment.value,
        credits: profile.data.credits - 1,
      },
      {
        onSuccess: () => {
          setLength(0);
          target.reset();
        },
      }
    );
  };
  const progress = `
    radial-gradient(closest-side, #242427 85%, transparent 80% 100%),
    conic-gradient(white ${Math.round((length / MAX_TOKENS) * 100)}%, #242427 0)
  `;
  return (
    <div className="mt-6 flex gap-x-3">
      {user ? (
        <img
          src={user.profileImageUrl}
          alt=""
          className="h-6 w-6 flex-none rounded-full bg-brand-700"
        />
      ) : (
        <span className="block h-6 w-6 flex-none rounded-full bg-brand-700"></span>
      )}
      <form className="relative flex-auto" onSubmit={handleOnCreateComment}>
        <div className="overflow-hidden rounded-lg pb-12 shadow-sm ring-1 ring-inset ring-brand-300 focus-within:ring-2">
          <label htmlFor="comment" className="sr-only">
            Add your comment
          </label>
          <textarea
            id={String(item.id)}
            rows={2}
            name="comment"
            className="block w-full resize-none border-0 bg-transparent py-1.5 text-sm leading-6 text-brand-50 placeholder:text-brand-50 focus:ring-0"
            placeholder="Add your comment..."
            maxLength={MAX_TOKENS}
            onChange={(e) => setLength(e.target.value.length)}
            required
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end py-2 pl-3 pr-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: progress }}
          ></div>
          <button
            type="submit"
            className="flex items-center space-x-1 rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand-50 shadow-sm"
          >
            <span>Comment (1</span>
            <TicketIcon className="h-5 w-5" />)
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Post() {
  const { user } = useUser();
  const { back, query } = useRouter();
  const utils = trpc.useContext();
  const post = trpc.getPost.useQuery(Number(query.id));
  const deletePost = trpc.deletePost.useMutation({
    onSuccess: () => {
      back();
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post deleted!");
      utils.getProfilePosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnDeletePost = () => {
    if (!post.data) return;
    toast.loading("Loading...");
    if (post.data.attachmentPath) {
      deleteAttachment.mutate(
        {
          attachmentPath: post.data.attachmentPath,
        },
        {
          onSuccess: () => {
            if (!post.data) return;
            deletePost.mutate({
              id: post.data.id,
            });
          },
        }
      );
    } else {
      deletePost.mutate({
        id: post.data.id,
      });
    }
  };
  return (
    <>
      <div className="pb-36">
        <Navbar />
        {post.data ? (
          <>
            {post.data.label === "PUBLIC" ? (
              <>
                <div className="mx-auto mt-12 max-w-7xl px-4 text-center">
                  <img
                    src="/post.png"
                    alt="post"
                    className="mx-auto mt-2 w-24"
                  />
                  <div className="mt-8 flex flex-1 justify-center">
                    <div className="flex w-full items-center justify-center space-x-6 px-2 text-2xl font-bold text-brand-50 sm:text-4xl lg:px-6">
                      <p>#{post.data.id}</p>
                    </div>
                  </div>
                </div>
                <div className="mx-auto mt-8 max-w-3xl px-2 lg:px-8">
                  <div className="flex items-center justify-center">
                    <div className="relative w-full px-4 py-6">
                      <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                        <div className="space-y-6 text-brand-50">
                          {post.data.attachment ? (
                            <img
                              className="h-full w-full rounded-lg"
                              src={post.data.attachment}
                              alt="attachment"
                            />
                          ) : null}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg">{post.data.title}</h4>
                              {post.data.authorId === user?.id ? (
                                <Menu
                                  as="div"
                                  className="relative inline-block text-left"
                                >
                                  <div>
                                    <Menu.Button className="flex items-center rounded-full text-brand-400 hover:text-brand-200">
                                      <EllipsisVerticalIcon
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </Menu.Button>
                                  </div>
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
                                      <div className="py-1">
                                        <>
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                className={clsx(
                                                  active
                                                    ? "bg-brand-100 text-brand-900"
                                                    : "text-brand-700",
                                                  "w-full px-4 py-2 text-left text-sm"
                                                )}
                                              >
                                                Edit
                                              </button>
                                            )}
                                          </Menu.Item>
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={handleOnDeletePost}
                                                className={clsx(
                                                  active
                                                    ? "bg-brand-100 text-brand-900"
                                                    : "text-brand-700",
                                                  "w-full px-4 py-2 text-left text-sm"
                                                )}
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </Menu.Item>
                                        </>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              ) : null}
                            </div>
                            <p>{post.data.description}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Dropdown item={post.data} />
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1 font-semibold">
                                <span>{post.data.author?.name}</span>
                                {post.data.author?.premium ? (
                                  <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                                ) : null}
                              </div>
                              <div>{`@${post.data.author?.username}`}</div>
                            </div>
                          </div>
                          <div className="relative flex flex-col space-y-6">
                            <div className="flex space-x-6">
                              <Like item={post.data} />
                              <Comment item={post.data} />
                              <Bookmark item={post.data} />
                            </div>
                            <BookmarkCheck item={post.data} />
                            <Comments item={post.data} />

                            <CommentBox item={post.data} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <span className="flex h-[30rem] w-screen items-center justify-center text-white">
                This post is not publicly accessible
              </span>
            )}
          </>
        ) : null}
      </div>
      <Footer />
    </>
  );
}
