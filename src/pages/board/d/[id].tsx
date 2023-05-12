import { SignedIn, useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Profile } from "@prisma/client";
import FriendDropdown from "@src/components/frienddropdown";
import LabelDropdown from "@src/components/labeldropdown";
import PinnedPosts from "@src/components/pinnedposts";
import PostAttachment from "@src/components/postattachment";
import PostButtons from "@src/components/postbuttons";
import PostCard from "@src/components/postcard";
import PostsSkeleton from "@src/components/postsskeleton";
import { RouterOutputs } from "@src/server/routers/_app";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRouter } from "next/router";
import { FormEvent, Fragment, MouseEvent } from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";
import { create } from "zustand";

const MAX_TOKENS = 720;
const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

type Post = RouterOutputs["getDefaultPosts"][number];

interface Store {
  open: boolean;
  post: Post | null;
  label: Label | null;
  friend: Profile | null;
  length: number;
  search: string;
  attachment: File | string | null;
  description: string;
  setOpen: (open: boolean) => void;
  setLabel: (label: Label | null) => void;
  setFriend: (friend: Profile | null) => void;
  setLength: (length: number) => void;
  setSearch: (search: string) => void;
  setAttachment: (attachment: File | string | null) => void;
  setDescription: (description: string) => void;
  handleOnClick: () => void;
  handleEditPost: (post: Post) => void;
}

const useStore = create<Store>()((set) => ({
  open: false,
  post: null,
  label: null,
  friend: null,
  length: 0,
  search: "",
  attachment: null,
  description: "",
  setOpen: (open) => set(() => ({ open })),
  setLabel: (label) => set(() => ({ label })),
  setFriend: (friend) => set(() => ({ friend })),
  setLength: (length) => set(() => ({ length })),
  setSearch: (search) => set(() => ({ search })),
  setAttachment: (attachment) => set(() => ({ attachment })),
  setDescription: (description) => set(() => ({ description })),
  handleOnClick: () =>
    set(() => ({
      length: 0,
      post: null,
      open: true,
      label: null,
      friend: null,
      description: "",
      attachment: null,
    })),
  handleEditPost: (post) =>
    set(() => ({
      open: true,
      post: post,
      friend: post.friend,
      label: post.label ?? null,
      attachment: post.attachment,
      description: post.description,
      length: post.description.length,
    })),
}));

function Modal() {
  /**
   * @description hooks
   */
  const { user } = useUser();
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();

  /**
   * @description state from store @see useStore
   */
  const open = useStore((state) => state.open);
  const post = useStore((state) => state.post);
  const label = useStore((state) => state.label);
  const friend = useStore((state) => state.friend);
  const length = useStore((state) => state.length);
  const setOpen = useStore((state) => state.setOpen);
  const setLabel = useStore((state) => state.setLabel);
  const setFriend = useStore((state) => state.setFriend);
  const setLength = useStore((state) => state.setLength);
  const attachment = useStore((state) => state.attachment);
  const description = useStore((state) => state.description);
  const setAttachment = useStore((state) => state.setAttachment);
  const setDescription = useStore((state) => state.setDescription);

  /**
   * @description delete attachment mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that takes care of file upload for both create and update mutation
   * @see createPost
   * @see updatePost
   */
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
        });
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message ?? API_ERROR_MESSAGE);
    }
  };

  /**
   * @description create post mutation that invokes an API call to a corresponding tRPC procedure
   */
  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post created!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the create post mutation @see createPost
   */
  const handleOnCreate = async (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!user?.id || !profile.data) return;
    toast.loading("Loading...");
    if (attachment && typeof attachment !== "string") {
      handleOnUpload(title, description);
    } else {
      createPost.mutate({
        label,
        title,
        description,
        authorId: user.id,
        friendId: friend?.id,
      });
    }
  };

  /**
   * @description update post mutation that invokes an API call to a corresponding tRPC procedure
   */
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      toast.success("Post updated!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the update post mutation @see updatePost
   */
  const handleOnUpdate = (title: string, description: string) => {
    if (!label) return toast.error("Please set a label for the post");
    if (!post) return;
    toast.loading("Loading...");
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

  /**
   * @description generate AI mutation that invokes an API call to a corresponding tRPC procedure
   */
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

  /**
   * @description event handler that triggers the generate AI mutation @see generateAI
   */
  const handleOnGenerateAI = () => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 10)
      return toast.error("You don't have enough credits");
    generateAI.mutate({
      prompt: description,
      credits: profile.data.credits - 10,
    });
  };

  /**
   * @description event handler that stores the newly changed value from the description text field
   */
  const handleOnChange = (text: string) => {
    setDescription(text);
    setLength(text.length);
  };

  /**
   * @description form event handler that triggers the update mutation if there's an existing post and create mutation if there isn't
   * @see updatePost
   * @see createPost
   */
  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    if (post) {
      handleOnUpdate(target.title.value, target.description.value);
    } else {
      handleOnCreate(target.title.value, target.description.value);
    }
  };

  /**
   * @description event handler for changing media file
   */
  const handleFileSelect = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as typeof event.target & {
      files: FileList;
    };
    const file = target.files[0];
    setAttachment(file);
  };

  /**
   * @link https://nikitahl.com/circle-progress-bar-css
   */
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

export default function Home() {
  /**
   * @link https://twitter.com/samselikoff/status/1651071826393550849
   */
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);
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

  /**
   * @description hooks
   */
  const utils = trpc.useContext();
  const { back, push } = useRouter();
  const posts = trpc.getDefaultPosts.useQuery();

  /**
   * @description state from store @see useStore
   */
  const setSearch = useStore((state) => state.setSearch);
  const handleOnClick = useStore((state) => state.handleOnClick);
  const handleEditPost = useStore((state) => state.handleEditPost);

  /**
   * @description filters posts based on search query from store @see useStore
   */
  const search = useStore((state) => state.search);
  const filterPost = (post: Post) => {
    return (
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase()) ||
      post.author.name.toLowerCase().includes(search.toLowerCase()) ||
      post.author.username.toLowerCase().includes(search.toLowerCase())
    );
  };

  /**
   * @description create like mutation that invokes an API call to a corresponding tRPC procedure
   */
  const createLike = trpc.createLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post liked!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the create like mutation @see createLike
   */
  const handleCreateLike = (
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

  /**
   * @description delete like mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deleteLike = trpc.deleteLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post unliked!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the delete like mutation @see deleteLike
   */
  const handleDeleteLike = (
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

  /**
   * @description update post mutation that invokes an API call to a corresponding tRPC procedure
   */
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post updated!");
      utils.getPinnedPosts.invalidate();
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the update post mutation @see updatePost
   */
  const handleUpdatePost = (post: Post, pinned: boolean) => {
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
   * @description delete post mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deletePost = trpc.deletePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post deleted!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the delete post mutation @see deletePost
   */
  const handleDeletePost = (post: Post) => {
    if (!post) return;
    toast.loading("Loading...");
    deletePost.mutate({
      id: post.id,
      attachmentPath: post.attachmentPath,
    });
  };

  /**
   * @description create bookmark mutation that invokes an API call to a corresponding tRPC procedure
   */
  const createBookmark = trpc.createBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post bookmarked!");
      utils.getDefaultPosts.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the create bookmark mutation @see createBookmark
   */
  const handleCreateBookmark = (
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

  /**
   * @description delete bookmark mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deleteBookmark = trpc.deleteBookmark.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getDefaultPosts.invalidate();
      toast.success("Post unbookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the delete bookmark mutation @see deleteBookmark
   */
  const handleDeleteBookmark = (
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
  return (
    <>
      <Modal />
      <div className="pb-36">
        <SignedIn>
          <div className="my-8 px-4 sm:mt-12 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => back()}
              className="flex items-center space-x-2 text-brand-50"
            >
              <ArrowLongLeftIcon className="h-5 w-5" />
              <span>Go back</span>
            </button>
          </div>
        </SignedIn>
        <img
          src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__8afdbf8e-6619-4141-8824-2935929db0bc.png"
          alt="banner"
          className="h-48 w-full object-cover sm:h-96"
        />
        <div className="-mt-[4.5rem] space-y-12">
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
                    className="block w-full rounded-lg border-0 bg-brand-600 px-10 py-3 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
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
          <PinnedPosts handleOnUpdatePost={handleUpdatePost} />
          <div className="flex items-center justify-center">
            <div className="w-full columns-xs gap-6 space-y-6">
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
                            handleOnEditPost={handleEditPost}
                            handleOnDeletePost={handleDeletePost}
                            handleOnUpdatePost={handleUpdatePost}
                            handleOnCreateLike={handleCreateLike}
                            handleOnDeleteLike={handleDeleteLike}
                            handleOnCreateBookmark={handleCreateBookmark}
                            handleOnDeleteBookmark={handleDeleteBookmark}
                          />
                        </div>
                      </div>
                    ))}
                </>
              ) : posts.isLoading || posts.isError ? (
                <PostsSkeleton />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
