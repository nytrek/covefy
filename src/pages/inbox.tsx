import { SignedIn, useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import { CheckBadgeIcon, PaperClipIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import Attachment from "@src/components/attachment";
import FriendDropdown from "@src/components/frienddropdown";
import Header from "@src/components/header";
import LabelDropdown from "@src/components/labeldropdown";
import PinnedPosts from "@src/components/pinnedposts";
import PostButtons from "@src/components/postbuttons";
import PostDropdown from "@src/components/postdropdown";
import PostSkeleton from "@src/components/postskeleton";
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
  post: Post | null;
  label: Label | null;
  friend: Profile | null;
  length: number;
  attachment: File | string | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setLabel: Dispatch<SetStateAction<Label | null>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
  setLength: Dispatch<SetStateAction<number>>;
  setAttachment: Dispatch<SetStateAction<File | string | null>>;
}

function Modal({
  open,
  post,
  label,
  friend,
  length,
  attachment,
  setOpen,
  setLabel,
  setFriend,
  setLength,
  setAttachment,
}: Props) {
  const { user } = useUser();

  const utils = trpc.useContext();

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const profile = trpc.getProfile.useQuery();

  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getInbox.invalidate();
      utils.getProfile.invalidate();
      toast.success("Post created!");
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
      utils.getInbox.invalidate();
      toast.success("Post updated!");
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

  const handleOnUpload = async (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (
      !user?.id ||
      !profile.data ||
      !attachment ||
      typeof attachment === "string"
    )
      return;
    try {
      const { fileUrl, filePath } = await upload.uploadFile(attachment, {
        path: {
          folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
          fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
        },
      });
      if (post) {
        updatePost.mutate({
          id: post.id,
          label,
          title,
          description,
          pinned: post.pinned,
          attachment: fileUrl,
          attachmentPath: filePath,
          friendId: friend?.id,
        });
      } else {
        createPost.mutate({
          label,
          title,
          description,
          attachment: fileUrl,
          attachmentPath: filePath,
          authorId: user.id,
          friendId: friend?.id,
          credits: profile.data.credits - 5,
        });
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message ?? API_ERROR_MESSAGE);
    }
  };

  const handleOnUpdate = (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!post) return;
    if (attachment && typeof attachment !== "string") {
      try {
        if (post.attachmentPath) {
          deleteAttachment.mutate(
            {
              attachmentPath: post.attachmentPath,
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
    } else if (!attachment && post.attachmentPath) {
      deleteAttachment.mutate(
        {
          attachmentPath: post.attachmentPath,
        },
        {
          onSuccess: () => {
            updatePost.mutate({
              id: post.id,
              label,
              title,
              description,
              pinned: post.pinned,
              attachment: null,
              attachmentPath: null,
              friendId: friend?.id,
            });
          },
        }
      );
    } else {
      updatePost.mutate({
        id: post.id,
        label,
        title,
        description,
        pinned: post.pinned,
        friendId: friend?.id,
      });
    }
  };

  const handleOnCreate = async (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!user?.id || !profile.data) return;
    if (profile.data.credits < 5)
      return toast.error("You don't have enough credits");
    else if (attachment && typeof attachment !== "string") {
      handleOnUpload(title, description);
    } else {
      createPost.mutate({
        label,
        title,
        description,
        authorId: user.id,
        friendId: friend?.id,
        credits: profile.data.credits - 5,
      });
    }
  };

  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    toast.loading("Loading...");
    if (post) {
      handleOnUpdate(target.title.value, target.description.value);
    } else {
      handleOnCreate(target.title.value, target.description.value);
    }
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
                      defaultValue={post?.title}
                      maxLength={100}
                      required
                    />
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
                      defaultValue={post?.description}
                      maxLength={MAX_TOKENS}
                      onChange={(e) => setLength(e.target.value.length)}
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
                    <Attachment
                      attachment={attachment}
                      setAttachment={setAttachment}
                    />
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

export default function Inbox() {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const { user } = useUser();

  const { push } = useRouter();

  const utils = trpc.useContext();

  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(0);
  const [search, setSearch] = useState("");
  const [post, setPost] = useState<Post | null>(null);
  const [label, setLabel] = useState<Label | null>(null);
  const [friend, setFriend] = useState<Profile | null>(null);
  const [attachment, setAttachment] = useState<File | string | null>(null);

  const posts = trpc.getInbox.useQuery();

  const filterPost = (post: Post) => {
    return (
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase()) ||
      post.author.name.toLowerCase().includes(search.toLowerCase()) ||
      post.author.username.toLowerCase().includes(search.toLowerCase())
    );
  };

  const createLike = trpc.createLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getInbox.invalidate();
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
      utils.getInbox.invalidate();
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
      utils.getInbox.invalidate();
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
      utils.getInbox.invalidate();
      toast.success("Post unbookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getInbox.invalidate();
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
      toast.dismiss();
      utils.getInbox.invalidate();
      utils.getProfile.invalidate();
      toast.success("Post deleted!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const handleOnClick = () => {
    setLength(0);
    setOpen(true);
    setPost(null);
    setLabel(null);
    setFriend(null);
    setAttachment(null);
  };

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

  const handleOnEditPost = (post: Post) => {
    setOpen(true);
    setPost(post);
    setFriend(post.friend);
    setLabel(post.label ?? null);
    setAttachment(post.attachment);
    setLength(post.description.length);
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
        post={post}
        label={label}
        friend={friend}
        length={length}
        attachment={attachment}
        setOpen={setOpen}
        setLabel={setLabel}
        setFriend={setFriend}
        setLength={setLength}
        setAttachment={setAttachment}
      />
      <div className="pb-36">
        <Header
          header="Scour through your digital inbox."
          search={search}
          setSearch={setSearch}
          handleOnClick={handleOnClick}
        />
        <div className="mt-16 px-4 sm:px-6 lg:px-8">
          <PinnedPosts handleOnUpdatePost={handleOnUpdatePost} />
          <div className="flex items-center justify-center">
            <div className="w-full columns-xs gap-6 space-y-6">
              <SignedIn>
                {posts.data ? (
                  <>
                    {posts.data
                      .filter((post) => filterPost(post))
                      .map((post) => (
                        <div
                          key={post.id}
                          className="relative w-full break-inside-avoid-column"
                        >
                          <div
                            onMouseMove={handleMouseMove}
                            className="group relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6"
                          >
                            <motion.button
                              type="button"
                              onClick={() => push("/post/" + post.id)}
                              className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                              style={{ background: flash }}
                            ></motion.button>

                            <div className="space-y-6 text-brand-50">
                              {!!post.attachmentPath && (
                                <div className="relative -my-2 -ml-2 inline-flex w-full items-center rounded-full px-3 py-2 text-left text-brand-400">
                                  <PaperClipIcon
                                    className="-ml-1 mr-2 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                  <span className="w-full truncate text-sm italic text-brand-500">
                                    {post.attachmentPath}
                                  </span>
                                </div>
                              )}

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-lg">{post.title}</h4>
                                  {post.authorId === user?.id && (
                                    <PostDropdown
                                      post={post}
                                      handleOnEditPost={handleOnEditPost}
                                      handleOnDeletePost={handleOnDeletePost}
                                      handleOnUpdatePost={handleOnUpdatePost}
                                    />
                                  )}
                                </div>
                                <p>{post.description}</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <ProfileDropdown post={post} />
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-1 font-semibold">
                                    <span>{post.author?.name}</span>
                                    {post.author?.premium && (
                                      <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                                    )}
                                  </div>
                                  <div>{`@${post.author?.username}`}</div>
                                </div>
                              </div>
                              <div className="relative flex flex-col space-y-6">
                                <PostStats
                                  post={post}
                                  handleOnCreateLike={handleOnCreateLike}
                                  handleOnDeleteLike={handleOnDeleteLike}
                                  handleOnCreateBookmark={
                                    handleOnCreateBookmark
                                  }
                                  handleOnDeleteBookmark={
                                    handleOnDeleteBookmark
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <PostSkeleton />
                )}
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
