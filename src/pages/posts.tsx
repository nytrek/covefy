import { SignedIn, useUser } from "@clerk/nextjs";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import Bookmark from "@src/components/Bookmark";
import Attachment from "@src/components/attachment";
import BookmarkCheck from "@src/components/bookmarkcheck";
import Comment from "@src/components/comment";
import ProfileDropdown from "@src/components/profiledropdown";
import FriendDropdown from "@src/components/frienddropdown";
import Header from "@src/components/header";
import LabelDropdown from "@src/components/labeldropdown";
import Like from "@src/components/like";
import PostButtons from "@src/components/postbuttons";
import PostSkeleton from "@src/components/postsskeleton";
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
  setOpen: Dispatch<SetStateAction<boolean>>;
  setLabel: Dispatch<SetStateAction<Label | null>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
  setLength: Dispatch<SetStateAction<number>>;
}

function Modal({
  open,
  post,
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
  const profile = trpc.getProfile.useQuery();

  /**
   * create post mutation that links to corresponding procedure in the backend
   */
  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Post created!");
      utils.getProfilePosts.invalidate();
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
      toast.success("Post updated!");
      utils.getProfilePosts.invalidate();
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
    if (!post) return; //we have values that depend on the data being not undefined
    updatePost.mutate({
      id: post.id, // 1.
      label: post.label, // 2.
      title: post.title, // 3.
      description: post.description, // 4.
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
    if (!user?.id || !profile.data) return;
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    if (!label) return toast("Please set a label for the post");
    toast.loading("Loading...");
    if (post) {
      if (attachment) {
        try {
          const { fileUrl, filePath } = await upload.uploadFile(attachment, {
            path: {
              folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
              fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
            },
          });
          updatePost.mutate({
            id: post.id,
            label,
            title: target.title.value,
            description: target.description.value,
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
          id: post.id,
          label,
          title: target.title.value,
          description: target.description.value,
          friendId: friend?.id,
        });
      }
    } else {
      // 1. - the cost of creating a post is 1 credit
      if (profile.data.credits < 1)
        return toast.error("You don't have enough credits");
      else if (attachment) {
        try {
          const { fileUrl, filePath } = await upload.uploadFile(attachment, {
            path: {
              folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
              fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
            },
          });
          createPost.mutate({
            label,
            title: target.title.value,
            description: target.description.value,
            attachment: fileUrl,
            attachmentPath: filePath,
            authorId: user.id, // 2.
            friendId: friend?.id,
            credits: profile.data.credits - 1, // 3.
          });
        } catch (e: any) {
          toast.dismiss();
          toast.error(e.message ?? API_ERROR_MESSAGE);
        }
      } else {
        createPost.mutate({
          label,
          title: target.title.value,
          description: target.description.value,
          authorId: user.id, // 4.
          friendId: friend?.id,
          credits: profile.data.credits - 1, // 5.
        });
      }
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
                 * Render any attachment connected to this post
                 */}
                <Attachment
                  attachment={attachment}
                  setAttachment={setAttachment}
                  postAttachment={{
                    attachment: post?.attachment,
                    attachmentPath: post?.attachmentPath,
                  }}
                  handleUpdate={handleUpdate}
                />

                {/**
                 * Render post form
                 */}
                <form className="relative" onSubmit={handleOnSubmit}>
                  {/**
                   * Render close button
                   */}
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
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
                      defaultValue={post?.title}
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
                      defaultValue={post?.description}
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
                        post?.attachment ? "justify-end" : "justify-between",
                        "flex items-center space-x-3 py-2 pl-2"
                      )}
                    >
                      {/**
                       * Only render the attachment button if the post has no prior attachment
                       */}
                      {!post?.attachment && (
                        <div className="flex">
                          <div className="group relative -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-brand-400">
                            <input
                              type="file"
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

export default function Posts() {
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
   * router hook by next
   */
  const { push } = useRouter();

  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * useState that might be replaced with a state management library
   */
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(0);
  const [search, setSearch] = useState("");
  const [post, setPost] = useState<Post | null>(null);
  const [label, setLabel] = useState<Label | null>(null);
  const [friend, setFriend] = useState<Profile | null>(null);

  /**
   * trpc queries
   */
  const posts = trpc.getProfilePosts.useQuery();

  /**
   * create like mutation that links to corresponding procedure in the backend
   */
  const createLike = trpc.createLike.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Post liked!");
      utils.getProfilePosts.invalidate();
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
      toast.success("Post unliked!");
      utils.getProfilePosts.invalidate();
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
      toast.success("Post bookmarked!");
      utils.getProfilePosts.invalidate();
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
      utils.getProfilePosts.invalidate();
      toast.success("Post unbookmarked!");
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
   * event handler for opening a fresh post
   */
  const handleOnClick = () => {
    setLength(0);
    setOpen(true);
    setPost(null);
    setLabel(null);
    setFriend(null);
  };

  /**
   * event handler for liking post
   */
  const handleOnCreateLike = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createLike.mutate({
      postId: id,
      profileId: user.id,
    });
  };

  /**
   * event handler for disliking post
   */
  const handleOnDeleteLike = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    deleteLike.mutate({
      postId: id,
      profileId: user.id,
    });
  };

  /**
   * event handler for editing post
   */
  const handleOnEditPost = (post: Post) => {
    setOpen(true);
    setPost(post);
    setFriend(post.friend);
    setLabel(post.label ?? null);
    setLength(post.description.length);
  };

  /**
   * event handler for deleting post
   */
  const handleOnDeletePost = (post: Post) => {
    if (!post) return;
    toast.loading("Loading...");
    if (post.attachmentPath) {
      deleteAttachment.mutate(
        {
          attachmentPath: post.attachmentPath,
        },
        {
          onSuccess: () => {
            if (!post) return;
            deletePost.mutate({
              id: post.id,
            });
          },
        }
      );
    } else {
      deletePost.mutate({
        id: post.id,
      });
    }
  };

  /**
   * event handler for creating bookmark
   */
  const handleOnCreateBookmark = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createBookmark.mutate({
      postId: id,
      profileId: user.id,
    });
  };

  /**
   * event handler for deleting bookmark
   */
  const handleOnDeleteBookmark = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    deleteBookmark.mutate({
      postId: id,
      profileId: user.id,
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
        post={post}
        label={label}
        friend={friend}
        length={length}
        setOpen={setOpen}
        setLabel={setLabel}
        setFriend={setFriend}
        setLength={setLength}
      />
      <div className="pb-36">
        <Header
          header="Collect your notes in one place."
          search={search}
          setSearch={setSearch}
          handleOnClick={handleOnClick}
        />
        <div className="mt-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="w-full columns-xs gap-6 space-y-6">
              <SignedIn>
                {posts.data ? (
                  <>
                    {posts.data
                      .filter(
                        (post) =>
                          post.title
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          post.description
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          post.author.name
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                          post.author.username
                            .toLowerCase()
                            .includes(search.toLowerCase())
                      )
                      .map((item, index) => (
                        <div
                          key={index}
                          className="relative w-full break-inside-avoid-column"
                        >
                          <div
                            onMouseMove={handleMouseMove}
                            className="group relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6"
                          >
                            {/**
                             * Render flash effect for the post container
                             */}
                            <motion.button
                              type="button"
                              onClick={() => push("/post/" + item.id)}
                              className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                              style={{ background: flash }}
                            ></motion.button>

                            <div className="space-y-6 text-brand-50">
                              {/**
                               * Render any attachment connected to this post
                               */}
                              {!!item.attachment && (
                                <img
                                  className="h-full w-full rounded-lg"
                                  src={item.attachment}
                                  alt="attachment"
                                />
                              )}

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-lg">{item.title}</h4>
                                  {/**
                                   * Render dropdown menu for the post only if the user is the author of that post
                                   */}
                                  {item.authorId === user?.id && (
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
                                            {/**
                                             * Render edit button for the post
                                             */}
                                            <Menu.Item>
                                              {({ active }) => (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOnEditPost(item)
                                                  }
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

                                            {/**
                                             * Render delete button for the post
                                             */}
                                            <Menu.Item>
                                              {({ active }) => (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleOnDeletePost(item)
                                                  }
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
                                          </div>
                                        </Menu.Items>
                                      </Transition>
                                    </Menu>
                                  )}
                                </div>
                                <p>{item.description}</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <ProfileDropdown item={item} />
                                {/**
                                 * Render user details
                                 */}
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-1 font-semibold">
                                    <span>{item.author?.name}</span>
                                    {item.author?.premium && (
                                      <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                                    )}
                                  </div>
                                  <div>{`@${item.author?.username}`}</div>
                                </div>
                              </div>
                              <div className="relative flex flex-col space-y-6">
                                {/**
                                 * Render the stats for this post
                                 */}
                                <div className="flex space-x-6">
                                  <Like
                                    item={item}
                                    handleOnCreateLike={handleOnCreateLike}
                                    handleOnDeleteLike={handleOnDeleteLike}
                                  />
                                  <Comment item={item} />
                                  <Bookmark
                                    item={item}
                                    handleOnCreateBookmark={
                                      handleOnCreateBookmark
                                    }
                                    handleOnDeleteBookmark={
                                      handleOnDeleteBookmark
                                    }
                                  />
                                </div>

                                {/**
                                 * Render a bookmark check if the user has bookmarked this post
                                 */}
                                <BookmarkCheck item={item} />
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
