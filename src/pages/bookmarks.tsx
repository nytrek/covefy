import { SignedIn, useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  PaperClipIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import FriendDropdown from "@src/components/frienddropdown";
import LabelDropdown from "@src/components/labeldropdown";
import PinnedPosts from "@src/components/pinnedposts";
import PostAttachment from "@src/components/postattachment";
import PostButtons from "@src/components/postbuttons";
import PostCard from "@src/components/postcard";
import PostSkeleton from "@src/components/postskeleton";
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
  post: Post | null;
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

function Modal({
  open,
  post,
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
  const { user } = useUser();

  const { push } = useRouter();

  const utils = trpc.useContext();

  const profile = trpc.getProfile.useQuery();

  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post created!");
      utils.getBookmarkedPosts.invalidate();
      if (friend) return push("/inbox");
      if (label === "PRIVATE") return push("/posts");
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
      toast.success("Post updated!");
      utils.getBookmarkedPosts.invalidate();
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
    if (profile.data.credits < 1000)
      return toast.error("You don't have enough credits");
    generateAI.mutate({
      prompt: description,
      credits: profile.data.credits - 4,
    });
  };

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
          credits: profile.data.credits - 2,
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
    else if (attachment && typeof attachment !== "string") {
      handleOnUpload(title, description);
    } else {
      createPost.mutate({
        label,
        title,
        description,
        authorId: user.id,
        friendId: friend?.id,
        credits: profile.data.credits - 2,
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

export default function Bookmarks() {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const { push } = useRouter();

  const utils = trpc.useContext();

  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(0);
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [post, setPost] = useState<Post | null>(null);
  const [label, setLabel] = useState<Label | null>(null);
  const [friend, setFriend] = useState<Profile | null>(null);
  const [attachment, setAttachment] = useState<File | string | null>(null);

  const posts = trpc.getBookmarkedPosts.useQuery();

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
      toast.success("Post liked!");
      utils.getBookmarkedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const deleteLike = trpc.deleteLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post unliked!");
      utils.getBookmarkedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const createBookmark = trpc.createBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post bookmarked!");
      utils.getBookmarkedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const deleteBookmark = trpc.deleteBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post unbookmarked!");
      utils.getBookmarkedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post updated!");
      utils.getPinnedPosts.invalidate();
      utils.getBookmarkedPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const deletePost = trpc.deletePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post deleted!");
      utils.getBookmarkedPosts.invalidate();
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
    setDescription("");
    setAttachment(null);
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

  const handleOnEditPost = (post: Post) => {
    setOpen(true);
    setPost(post);
    setFriend(post.friend);
    setLabel(post.label ?? null);
    setAttachment(post.attachment);
    setDescription(post.description);
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
        post={post}
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
        <div className="space-y-12">
          <div className="mx-auto mt-12 max-w-xl space-y-10 px-4 text-center">
            <p className="text-3xl font-semibold text-brand-50"></p>
            <div className="flex flex-1 justify-center">
              <div className="w-full lg:px-6">
                <label htmlFor="search" className="sr-only">
                  Search posts
                </label>
                <div className="relative flex items-center text-brand-50">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 px-10 py-3 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
                    placeholder="Search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button type="button" onClick={handleOnClick}>
                    <PencilSquareIcon className="absolute right-3 top-3 h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 px-4 sm:mt-12 sm:px-6 lg:px-8">
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
                            className="group relative rounded-2xl border border-brand-600 bg-brand-800 text-sm leading-6"
                          >
                            <motion.button
                              type="button"
                              onClick={() => push("/post/" + post.id)}
                              className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                              style={{ background: flash }}
                            ></motion.button>

                            <PostCard
                              post={post}
                              handleOnEditPost={handleOnEditPost}
                              handleOnDeletePost={handleOnDeletePost}
                              handleOnUpdatePost={handleOnUpdatePost}
                              handleOnCreateLike={handleOnCreateLike}
                              handleOnDeleteLike={handleOnDeleteLike}
                              handleOnCreateBookmark={handleOnCreateBookmark}
                              handleOnDeleteBookmark={handleOnDeleteBookmark}
                            />
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
