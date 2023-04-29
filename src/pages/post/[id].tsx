import { useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  CheckBadgeIcon,
  PaperClipIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import Attachment from "@src/components/attachment";
import BookmarkCheck from "@src/components/bookmarkcheck";
import CommentBox from "@src/components/commentbox";
import Comments from "@src/components/comments";
import FriendDropdown from "@src/components/frienddropdown";
import LabelDropdown from "@src/components/labeldropdown";
import PinnedPosts from "@src/components/pinnedposts";
import PostButtons from "@src/components/postbuttons";
import PostDropdown from "@src/components/postdropdown";
import PostStats from "@src/components/poststats";
import ProfileDropdown from "@src/components/profiledropdown";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRouter } from "next/router";
import {
  Dispatch,
  FormEvent,
  Fragment,
  MouseEvent,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";

const MAX_TOKENS = 720;
const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

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

interface Props {
  open: boolean;
  label: Label | null;
  friend: Profile | null;
  length: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setLabel: Dispatch<SetStateAction<Label | null>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
  setLength: Dispatch<SetStateAction<number>>;
}

function Modal({
  open,
  label,
  friend,
  length,
  setOpen,
  setLabel,
  setFriend,
  setLength,
}: Props) {
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * router hook by next
   */
  const { query } = useRouter();

  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * useState that might be replaced with a state management library
   */
  const [attachment, setAttachment] = useState<File | null>(null);

  /**
   * useRef hook
   */
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * trpc queries
   */
  const id = query.id ?? 0;
  const post = trpc.getPost.useQuery(Number(id));

  /**
   * update post mutation that links to corresponding procedure in the backend
   */
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post updated!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * event handler for updating post
   */
  const handleUpdate = () => {
    if (!post.data) return; //we have values that depend on the data being not undefined
    updatePost.mutate({
      id: post.data.id, // 1.
      label: post.data.label, // 2.
      title: post.data.title, // 3.
      description: post.data.description, // 4.
      pinned: post.data.pinned, // 5.
      attachment: null,
      attachmentPath: null,
    });
  };

  /**
   * event handler for form submission
   */
  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //we have values that depend on the data being not undefined
    if (!post.data) return;
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    if (!label) return toast("Please set a label for the post");
    toast.loading("Loading...");
    if (attachment) {
      try {
        const { fileUrl, filePath } = await upload.uploadFile(attachment, {
          path: {
            folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
            fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
          },
        });
        updatePost.mutate({
          id: post.data.id, // 1.
          label,
          title: target.title.value,
          description: target.description.value,
          pinned: post.data.pinned, // 2.
          attachment: fileUrl,
          attachmentPath: filePath,
          friendId: friend?.id,
        });
      } catch (e: any) {
        toast.dismiss();
        toast.error(e.message ?? API_ERROR_MESSAGE);
      }
    } else {
      updatePost.mutate({
        id: post.data.id, // 1.
        label,
        title: target.title.value,
        description: target.description.value,
        pinned: post.data.pinned, // 2.
        friendId: friend?.id,
      });
    }
  };

  /**
   * event handler for selecting attachment file
   */
  const handleFileSelect = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as typeof event.target & {
      files: FileList;
    };
    const file = target.files[0];
    setAttachment(file);
  };

  /**
   * character length indicator effect
   */
  const progress = `
    radial-gradient(closest-side, white 85%, transparent 80% 100%),
    conic-gradient(#242427 ${Math.round((length / MAX_TOKENS) * 100)}%, white 0)
  `;

  /**
   * render empty UI if the post data has not loaded in
   */
  if (!post.data) return <></>;

  /**
   * render UI
   */
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-900 bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl transform space-y-4 overflow-hidden rounded-lg bg-brand-50 px-4 pb-4 pt-5 text-left shadow-xl transition-all">
                {/**
                 * Render post form
                 */}
                <form className="relative" onSubmit={handleOnSubmit}>
                  {/**
                   * Render close button
                   */}
                  <button
                    type="button"
                    className="absolute right-1 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
                    onClick={() => setOpen(false)}
                  >
                    <XMarkIcon className="h-5 w-5 text-brand-600" />
                  </button>

                  <div className="overflow-hidden rounded-lg">
                    {/**
                     * Render title field
                     */}
                    <label htmlFor="title" className="sr-only">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full border-0 pr-12 pt-2.5 text-lg font-medium placeholder:text-brand-400 focus:ring-0"
                      placeholder="Title (100 char)"
                      defaultValue={post.data?.title}
                      maxLength={100}
                      required
                    />

                    {/**
                     * Render description field
                     */}
                    <label htmlFor="description" className="sr-only">
                      Description
                    </label>
                    <textarea
                      rows={10}
                      ref={descriptionRef}
                      name="description"
                      id="description"
                      className="block w-full resize-none border-0 py-0 text-brand-900 placeholder:text-brand-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Write a description or a prompt for the AI generation"
                      defaultValue={post.data?.description}
                      maxLength={MAX_TOKENS}
                      onChange={(e) => setLength(e.target.value.length)}
                      required
                    />
                  </div>

                  {/**
                   * Render max character indicator
                   */}
                  <div className="flex justify-end px-4 pt-4">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ background: progress }}
                    ></div>
                  </div>

                  {/**
                   * Render post toolkit
                   */}
                  <div>
                    <div
                      className={clsx(
                        post.data?.attachment
                          ? "justify-end"
                          : "justify-between",
                        "flex items-center space-x-3 py-2 pl-1"
                      )}
                    >
                      {/**
                       * Only render the attachment button if the post has no prior attachment
                       */}
                      {!post.data?.attachment && (
                        <div className="flex">
                          <div className="group relative -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-brand-400">
                            <input
                              key={Number(!!attachment)}
                              type="file"
                              accept=".png, .jpg, .jpeg, .mp3, .mp4"
                              className="absolute inset-0 opacity-0"
                              onChange={(event) => handleFileSelect(event)}
                            />
                            <PaperClipIcon
                              className="-ml-1 mr-2 h-5 w-5 group-hover:text-brand-500"
                              aria-hidden="true"
                            />
                            <span className="text-sm italic text-brand-500 group-hover:text-brand-600">
                              Attach a file
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-nowrap justify-end space-x-2 py-2">
                        {/**
                         * Render friend dropdown
                         */}
                        <FriendDropdown friend={friend} setFriend={setFriend} />

                        {/**
                         * Render label dropdown
                         */}
                        <LabelDropdown label={label} setLabel={setLabel} />
                      </div>
                    </div>
                    {/**
                     * Render any attachment connected to this post
                     */}
                    <Attachment
                      attachment={attachment}
                      setAttachment={setAttachment}
                      postAttachment={{
                        attachment: post.data.attachment,
                        attachmentPath: post.data.attachmentPath,
                      }}
                      handleUpdate={handleUpdate}
                    />

                    {/**
                     * Render post buttons
                     */}
                    <PostButtons
                      edit={!!post}
                      setLength={setLength}
                      descriptionRef={descriptionRef}
                    />
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function Post() {
  /**
   * Mouse position
   */
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * router hook by next
   */
  const { back, query } = useRouter();

  /**
   * useState that might be replaced with a state management library
   */
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(0);
  const [label, setLabel] = useState<Label | null>(null);
  const [friend, setFriend] = useState<Profile | null>(null);

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery();
  const id = query.id ?? 0;
  const post = trpc.getPost.useQuery(Number(id));

  /**
   * create like mutation that links to corresponding procedure in the backend
   */
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

  /**
   * delete like mutation that links to corresponding procedure in the backend
   */
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

  /**
   * create comment mutation that links to corresponding procedure in the backend
   */
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

  /**
   * delete comment mutation that links to corresponding procedure in the backend
   */
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

  /**
   * create bookmark mutation that links to corresponding procedure in the backend
   */
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

  /**
   * delete bookmark mutation that links to corresponding procedure in the backend
   */
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

  /**
   * update post mutation that links to corresponding procedure in the backend
   */
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getPost.invalidate();
      toast.success("Post updated!");
      utils.getPinnedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * delete post mutation that links to corresponding procedure in the backend
   */
  const deletePost = trpc.deletePost.useMutation({
    onSuccess: () => {
      back();
      toast.dismiss();
      utils.getPost.invalidate();
      utils.getProfile.invalidate();
      toast.success("Post deleted!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * delete attachment mutation that links to corresponding procedure in the backend
   */
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * event handler for editing post
   */
  const handleOnEditPost = () => {
    if (!post.data) return; //we have values that depend on the data being not undefined
    setOpen(true);
    setLabel(post.data.label); // 1.
    setLength(post.data.description.length); // 2.
    if (post.data.friend) setFriend(post.data.friend); // 3.
  };

  /**
   * event handler for updating post
   */
  const handleOnUpdatePost = (post: Post, pinned: boolean) => {
    toast.loading("Loading...");
    updatePost.mutate({
      id: post.id,
      label: post.label,
      title: post.title,
      description: post.description,
      pinned,
    });
  };

  /**
   * event handler for deleting post
   */
  const handleOnDeletePost = () => {
    if (!post.data) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    // 1.
    if (post.data.attachmentPath) {
      deleteAttachment.mutate(
        {
          attachmentPath: post.data.attachmentPath, // 2.
        },
        {
          onSuccess: () => {
            if (!post.data) return;
            deletePost.mutate({
              id: post.data.id, // 3.
            });
          },
        }
      );
    } else {
      deletePost.mutate({
        id: post.data.id, // 4.
      });
    }
  };

  /**
   * event handler for liking post
   */
  const handleOnCreateLike = (id: number) => {
    if (!user?.id) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    createLike.mutate({
      postId: id,
      profileId: user.id, // 1.
    });
  };

  /**
   * event handler for disliking post
   */
  const handleOnDeleteLike = (id: number) => {
    if (!user?.id) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    deleteLike.mutate({
      postId: id,
      profileId: user.id, // 1.
    });
  };

  /**
   * event handler for creating comment
   */
  const handleOnCreateComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !profile.data) return; //we have values that depend on the data being not undefined
    // 1. - the cost of creating a comment is 1 credit
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
        credits: profile.data.credits - 1, // 2.
      },
      {
        onSuccess: () => {
          setLength(0);
          target.reset(); //reset the comment field on success
        },
      }
    );
  };

  /**
   * event handler for deleting comment
   */
  const handleOnDeleteComment = (id: number) => {
    toast.loading("Loading...");
    deleteComment.mutate({ id });
  };

  /**
   * event handler for creating bookmark
   */
  const handleOnCreateBookmark = (id: number) => {
    if (!user?.id) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    createBookmark.mutate({
      postId: id,
      profileId: user.id, // 1.
    });
  };

  /**
   * event handler for deleting bookmark
   */
  const handleOnDeleteBookmark = (id: number) => {
    if (!user?.id) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    deleteBookmark.mutate({
      postId: id,
      profileId: user.id, // 1.
    });
  };

  /**
   * event handler for mouse movement
   */
  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  /**
   * flash effect
   */
  const flash = useMotionTemplate`
  radial-gradient(
    650px circle at ${mouseX}px ${mouseY}px,
    rgba(255, 255, 255, 0.05),
    transparent 80%
  )
`;
  return (
    <>
      <Modal
        open={open}
        label={label}
        friend={friend}
        length={length}
        setOpen={setOpen}
        setLabel={setLabel}
        setFriend={setFriend}
        setLength={setLength}
      />
      <div className="pb-36">
        <div className="mx-auto mt-8 max-w-xl px-2 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="relative w-full space-y-6 px-4 py-6">
              <button
                type="button"
                onClick={() => back()}
                className="flex items-center space-x-2 text-brand-50"
              >
                <ArrowLongLeftIcon className="h-5 w-5" />
                <span>Go back</span>
              </button>
              {!!post.data ? (
                <>
                  <PinnedPosts handleOnUpdatePost={handleOnUpdatePost} />
                  {post.data.label === "PUBLIC" ||
                  post.data.authorId === user?.id ||
                  post.data.friendId === user?.id ? (
                    <div
                      onMouseMove={handleMouseMove}
                      className="group relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6"
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: flash }}
                      ></motion.div>

                      <div className="space-y-6 text-brand-50">
                        {!!post.data.attachment && (
                          <>
                            {post.data.attachment.includes(".mp4") ? (
                              <video className="w-full rounded-lg" controls>
                                <source
                                  src={post.data.attachment}
                                  type="video/mp4"
                                />
                              </video>
                            ) : post.data.attachment.includes(".mp3") ? (
                              <audio className="w-full rounded-lg" controls>
                                <source
                                  src={post.data.attachment}
                                  type="audio/mp3"
                                />
                              </audio>
                            ) : (
                              <img
                                className="h-full w-full rounded-lg"
                                src={post.data.attachment}
                                alt="attachment"
                              />
                            )}
                          </>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg">{post.data.title}</h4>
                            {post.data.authorId === user?.id && (
                              <PostDropdown
                                post={post.data}
                                handleOnEditPost={handleOnEditPost}
                                handleOnDeletePost={handleOnDeletePost}
                                handleOnUpdatePost={handleOnUpdatePost}
                              />
                            )}
                          </div>
                          <p>{post.data.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <ProfileDropdown post={post.data} />
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1 font-semibold">
                              <span>{post.data.author?.name}</span>
                              {post.data.author?.premium && (
                                <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                              )}
                            </div>
                            <div>{`@${post.data.author?.username}`}</div>
                          </div>
                        </div>
                        <div className="relative flex flex-col space-y-6">
                          <PostStats
                            post={post.data}
                            handleOnCreateLike={handleOnCreateLike}
                            handleOnDeleteLike={handleOnDeleteLike}
                            handleOnCreateBookmark={handleOnCreateBookmark}
                            handleOnDeleteBookmark={handleOnDeleteBookmark}
                          />
                          <Comments
                            item={post.data}
                            handleOnDeleteComment={handleOnDeleteComment}
                          />
                          <CommentBox
                            item={post.data}
                            handleOnCreateComment={handleOnCreateComment}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-brand-50">
                      This post is not publicly accessible
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="relative w-full break-inside-avoid-column">
                    <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                      <div className="space-y-6 text-brand-50 motion-safe:animate-pulse">
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/5 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/5 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-4/5 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-2.5 w-2/3 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
