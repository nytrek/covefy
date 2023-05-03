import { useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowLongLeftIcon, PaperClipIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import CommentBox from "@src/components/commentbox";
import FriendDropdown from "@src/components/frienddropdown";
import LabelDropdown from "@src/components/labeldropdown";
import PinnedPosts from "@src/components/pinnedposts";
import PostAttachment from "@src/components/postattachment";
import PostButtons from "@src/components/postbuttons";
import PostCard from "@src/components/postcard";
import PostComments from "@src/components/postcomments";
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
    _count: true;
    author: true;
    friend: true;
    likes: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
          };
        };
      };
    };
    bookmarks: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

interface Props {
  open: boolean;
  label: Label | null;
  friend: Profile | null;
  length: number;
  attachment: File | string | null;
  description: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setLabel: Dispatch<SetStateAction<Label | null>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
  setLength: Dispatch<SetStateAction<number>>;
  setAttachment: Dispatch<SetStateAction<File | string | null>>;
  setDescription: Dispatch<SetStateAction<string>>;
}

function LoadingSkeleton() {
  return (
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
  );
}

function Modal({
  open,
  label,
  friend,
  length,
  attachment,
  description,
  setOpen,
  setLabel,
  setFriend,
  setLength,
  setAttachment,
  setDescription,
}: Props) {
  const { query } = useRouter();

  const utils = trpc.useContext();

  const profile = trpc.getProfile.useQuery();

  const id = query.id ?? 0;
  const post = trpc.getPost.useQuery(Number(id));

  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      toast.success("Post updated!");
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

  const generateAI = trpc.generateAIResponse.useMutation({
    onSuccess: (data) => {
      let i = 0;
      if (!data)
        return toast.error("AI didn't output any text. Please try again.");
      const text = data.trim();
      const intervalId = setInterval(() => {
        i++;
        setDescription(text.slice(0, i));
        setLength(text.slice(0, i).length);
        if (i > text.length) {
          clearInterval(intervalId);
        }
      }, 20);
      utils.getProfile.invalidate();
      toast.success("Updated your post with AI generated text!");
    },
    onError: (err: any) => toast.error(err.message ?? API_ERROR_MESSAGE),
  });

  const handleOnGenerateAI = () => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 10)
      return toast.error("You don't have enough credits");
    generateAI.mutate({
      prompt: description,
      credits: profile.data.credits - 10,
    });
  };

  const handleOnUpload = async (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!post.data || !attachment || typeof attachment === "string") return;
    try {
      const { fileUrl, filePath } = await upload.uploadFile(attachment, {
        path: {
          folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
          fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
        },
      });
      updatePost.mutate({
        id: post.data.id,
        label,
        title,
        description,
        pinned: post.data.pinned,
        attachment: fileUrl,
        attachmentPath: filePath,
        friendId: friend?.id,
      });
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message ?? API_ERROR_MESSAGE);
    }
  };

  const handleOnUpdate = (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!post.data) return;
    if (attachment && typeof attachment !== "string") {
      try {
        if (post.data.attachmentPath) {
          deleteAttachment.mutate(
            {
              attachmentPath: post.data.attachmentPath,
            },
            {
              onSuccess: () => handleOnUpload(title, description),
            }
          );
        } else {
          handleOnUpload(title, description);
        }
      } catch (e: any) {
        toast.dismiss();
        toast.error(e.message ?? API_ERROR_MESSAGE);
      }
    } else if (!attachment && post.data.attachmentPath) {
      deleteAttachment.mutate(
        {
          attachmentPath: post.data.attachmentPath,
        },
        {
          onSuccess: () => {
            if (!post.data) return;
            updatePost.mutate({
              id: post.data.id,
              label,
              title,
              description,
              pinned: post.data.pinned,
              attachment: null,
              attachmentPath: null,
              friendId: friend?.id,
            });
          },
        }
      );
    } else {
      updatePost.mutate({
        id: post.data.id,
        label,
        title,
        description,
        pinned: post.data.pinned,
        friendId: friend?.id,
      });
    }
  };

  const handleOnChange = (text: string) => {
    setDescription(text);
    setLength(text.length);
  };

  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    toast.loading("Loading...");
    handleOnUpdate(target.title.value, target.description.value);
  };

  const handleFileSelect = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as typeof event.target & {
      files: FileList;
    };
    const file = target.files[0];
    setAttachment(file);
  };

  const progress = `
    radial-gradient(closest-side, white 85%, transparent 80% 100%),
    conic-gradient(#242427 ${Math.round((length / MAX_TOKENS) * 100)}%, white 0)
  `;
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
                <form className="relative" onSubmit={handleOnSubmit}>
                  <button
                    type="button"
                    className="absolute right-1 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
                    onClick={() => setOpen(false)}
                  >
                    <XMarkIcon className="h-5 w-5 text-brand-600" />
                  </button>

                  <div className="overflow-hidden rounded-lg">
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
                      disabled={generateAI.isLoading}
                      required
                    />
                    <label htmlFor="description" className="sr-only">
                      Description
                    </label>
                    <textarea
                      rows={10}
                      name="description"
                      id="description"
                      className="block w-full resize-none border-0 py-0 text-brand-900 placeholder:text-brand-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Write a description or a prompt for the AI generation"
                      value={description}
                      maxLength={MAX_TOKENS}
                      onChange={(e) => handleOnChange(e.target.value)}
                      disabled={generateAI.isLoading}
                      required
                    />
                  </div>
                  <div className="flex justify-end px-4 pt-4">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ background: progress }}
                    ></div>
                  </div>
                  <div>
                    <div
                      className={clsx(
                        attachment ? "justify-end" : "justify-between",
                        "flex items-center space-x-3 py-2 pl-1"
                      )}
                    >
                      {!!!attachment && (
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
                        <FriendDropdown friend={friend} setFriend={setFriend} />
                        <LabelDropdown label={label} setLabel={setLabel} />
                      </div>
                    </div>
                    <PostAttachment
                      attachment={attachment}
                      setAttachment={setAttachment}
                    />
                    <PostButtons
                      edit={!!post}
                      isLoading={generateAI.isLoading}
                      handleOnGenerateAI={handleOnGenerateAI}
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
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const { user } = useUser();

  const utils = trpc.useContext();

  const { back, query } = useRouter();

  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(0);
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState<Label | null>(null);
  const [friend, setFriend] = useState<Profile | null>(null);
  const [attachment, setAttachment] = useState<File | string | null>(null);

  const id = query.id ?? 0;
  const post = trpc.getPost.useQuery(Number(id));

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

  const handleOnEditPost = () => {
    if (!post.data) return;
    setOpen(true);
    setLabel(post.data.label);
    setAttachment(post.data.attachment);
    setDescription(post.data.description);
    setLength(post.data.description.length);
    if (post.data.friend) setFriend(post.data.friend);
  };

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

  const handleOnDeletePost = (post: Post) => {
    if (!post) return;
    toast.loading("Loading...");
    deletePost.mutate({
      id: post.id,
      attachmentPath: post.attachmentPath,
    });
  };

  const handleOnCreateLike = (
    postId: number,
    profileId: string,
    popularity: number
  ) => {
    toast.loading("Loading...");
    createLike.mutate({
      postId,
      profileId,
      popularity,
    });
  };

  const handleOnDeleteLike = (
    postId: number,
    profileId: string,
    popularity: number
  ) => {
    toast.loading("Loading...");
    deleteLike.mutate({
      postId,
      profileId,
      popularity,
    });
  };

  const handleOnCreateBookmark = (
    postId: number,
    profileId: string,
    popularity: number
  ) => {
    toast.loading("Loading...");
    createBookmark.mutate({
      postId,
      profileId,
      popularity,
    });
  };

  const handleOnDeleteBookmark = (
    postId: number,
    profileId: string,
    popularity: number
  ) => {
    toast.loading("Loading...");
    deleteBookmark.mutate({
      postId,
      profileId,
      popularity,
    });
  };

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

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
        attachment={attachment}
        description={description}
        setOpen={setOpen}
        setLabel={setLabel}
        setFriend={setFriend}
        setLength={setLength}
        setAttachment={setAttachment}
        setDescription={setDescription}
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
                      className="group relative rounded-2xl border border-brand-600 bg-brand-800 text-sm leading-6"
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                        style={{ background: flash }}
                      ></motion.div>

                      <PostCard
                        post={post.data}
                        handleOnEditPost={handleOnEditPost}
                        handleOnDeletePost={handleOnDeletePost}
                        handleOnUpdatePost={handleOnUpdatePost}
                        handleOnCreateLike={handleOnCreateLike}
                        handleOnDeleteLike={handleOnDeleteLike}
                        handleOnCreateBookmark={handleOnCreateBookmark}
                        handleOnDeleteBookmark={handleOnDeleteBookmark}
                      >
                        {!!post.data.comments.length && (
                          <PostComments post={post.data} />
                        )}
                        <CommentBox post={post.data} />
                      </PostCard>
                    </div>
                  ) : (
                    <p className="text-brand-50">
                      This post is not publicly accessible
                    </p>
                  )}
                </>
              ) : (
                <LoadingSkeleton />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
