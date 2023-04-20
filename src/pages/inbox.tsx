import { useUser } from "@clerk/nextjs";
import { Dialog, Listbox, Menu, Transition } from "@headlessui/react";
import {
  BookmarkIcon as BookmarkIconSolid,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconSolid,
  CheckBadgeIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  HandThumbUpIcon as HandThumbUpIconSolid,
  PaperClipIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import {
  BookmarkIcon as BookmarkIconOutline,
  ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconOutline,
  HandThumbUpIcon as HandThumbUpIconOutline,
  TicketIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Label, Prisma, Profile } from "@prisma/client";
import Footer from "@src/components/footer";
import Header from "@src/components/header";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  FormEvent,
  Fragment,
  MutableRefObject,
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

function Attachment({
  post,
  attachment,
  setOpen,
  setAttachment,
}: {
  post: Post | null;
  attachment: File | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setAttachment: Dispatch<SetStateAction<File | null>>;
}) {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();
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
  const handleOnDeleteAttachment = () => {
    if (!post?.attachmentPath) return;
    toast.loading("Loading...");
    deleteAttachment.mutate(
      {
        attachmentPath: post.attachmentPath,
      },
      {
        onSuccess: () => {
          updatePost.mutate({
            id: post.id,
            label: post.label,
            title: post.title,
            description: post.description,
            attachment: null,
            attachmentPath: null,
          });
        },
      }
    );
  };
  return (
    <>
      {attachment ? (
        <div className="relative">
          <img
            className="h-full w-full rounded-lg"
            src={URL.createObjectURL(attachment)}
            alt="attachment"
          />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={() => setAttachment(null)}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : post?.attachment && profile.data?.plan === "ENTERPRISE" ? (
        <div className="relative">
          <img
            className="h-full w-full rounded-lg"
            src={post.attachment}
            alt="attachment"
          />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
            onClick={handleOnDeleteAttachment}
          >
            <XMarkIcon className="h-5 w-5 text-brand-600" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function FriendDropdown({
  post,
  friend,
  setFriend,
}: {
  post: Post | null;
  friend: Profile | null;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
}) {
  const friends = trpc.getFriends.useQuery();
  return (
    <>
      {post?.friend ? (
        <div className="flex-shrink-0">
          <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
            {post.friend.imageUrl ? (
              <img
                src={post.friend.imageUrl}
                alt=""
                className="h-5 w-5 flex-shrink-0 rounded-full"
              />
            ) : (
              <UserCircleIcon
                className="h-5 w-5 flex-shrink-0 text-brand-300 sm:-ml-1"
                aria-hidden="true"
              />
            )}

            <span className="ml-2 block truncate text-sm font-bold text-brand-500">
              {post.friend.name}
            </span>
          </div>
        </div>
      ) : (
        <Listbox
          as="div"
          value={friend}
          onChange={setFriend}
          className="flex-shrink-0"
        >
          {({ open }) => (
            <>
              <Listbox.Label className="sr-only"> Send to </Listbox.Label>
              <div className="relative">
                <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                  {friend === null ? (
                    <UserCircleIcon
                      className="h-5 w-5 flex-shrink-0 text-brand-300 sm:-ml-1"
                      aria-hidden="true"
                    />
                  ) : (
                    <img
                      src={friend.imageUrl}
                      alt=""
                      className="h-5 w-5 flex-shrink-0 rounded-full"
                    />
                  )}

                  <span className="ml-2 block truncate text-sm font-bold text-brand-500">
                    {friend === null ? "Send to" : friend.name}
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                    <Listbox.Option
                      key={null}
                      className={({ active }) =>
                        clsx(
                          active ? "bg-brand-100" : "bg-brand-50",
                          "relative cursor-default select-none px-3 py-2"
                        )
                      }
                      value={null}
                    >
                      <div className="flex items-center">
                        <UserCircleIcon
                          className="h-5 w-5 flex-shrink-0 text-brand-400"
                          aria-hidden="true"
                        />
                        <span className="ml-3 block truncate text-sm font-bold text-brand-500">
                          Send to
                        </span>
                      </div>
                    </Listbox.Option>
                    {friends.data?.map((friend) => (
                      <Listbox.Option
                        key={friend.friend.id}
                        className={({ active }) =>
                          clsx(
                            active ? "bg-brand-100" : "bg-brand-50",
                            "relative cursor-default select-none px-3 py-2"
                          )
                        }
                        value={friend.friend}
                      >
                        <div className="flex items-center">
                          {friend.friend.imageUrl ? (
                            <img
                              src={friend.friend.imageUrl}
                              alt=""
                              className="h-5 w-5 flex-shrink-0 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon
                              className="h-5 w-5 flex-shrink-0 text-brand-400"
                              aria-hidden="true"
                            />
                          )}

                          <span className="ml-3 block truncate text-sm font-bold text-brand-500">
                            {friend.friend.name}
                          </span>
                        </div>
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      )}
    </>
  );
}

function LabelDropdown({
  post,
  label,
  setLabel,
}: {
  post: Post | null;
  label: Label | null;
  setLabel: Dispatch<SetStateAction<Label | null>>;
}) {
  return (
    <Listbox
      as="div"
      value={label}
      onChange={setLabel}
      className="flex-shrink-0"
    >
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only"> Add a label </Listbox.Label>
          <div className="relative">
            <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
              <TagIcon
                className="h-5 w-5 flex-shrink-0 text-brand-500 sm:-ml-1"
                aria-hidden="true"
              />
              <input
                name="label"
                key={label}
                defaultValue={
                  label ? label : post?.label ? post?.label : "Set label"
                }
                className="ml-2 w-16 cursor-pointer truncate bg-transparent text-sm font-bold text-brand-500"
                disabled
              />
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-brand-50 py-3 text-base shadow ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option
                  key="PUBLIC"
                  className={({ active }) =>
                    clsx(
                      active ? "bg-brand-100" : "bg-brand-50",
                      "relative cursor-default select-none px-3 py-2"
                    )
                  }
                  value="PUBLIC"
                >
                  <div className="flex items-center">
                    <span className="block truncate text-sm font-bold text-brand-500">
                      PUBLIC
                    </span>
                  </div>
                </Listbox.Option>
                <Listbox.Option
                  key="PRIVATE"
                  className={({ active }) =>
                    clsx(
                      active ? "bg-brand-100" : "bg-brand-50",
                      "relative cursor-default select-none px-3 py-2"
                    )
                  }
                  value="PRIVATE"
                >
                  <div className="flex items-center">
                    <span className="block truncate text-sm font-bold text-brand-500">
                      PRIVATE
                    </span>
                  </div>
                </Listbox.Option>
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}

function PostButtons({
  edit,
  descriptionRef,
}: {
  edit: boolean;
  descriptionRef: MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();
  const generateAI = trpc.generateAIResponse.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Updated your post with AI generated text!");
      descriptionRef.current
        ? (descriptionRef.current.value = (data ?? "").trim())
        : null;
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnGenerateAI = (prompt: string | undefined) => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 5) {
      toast.dismiss();
      return toast.error("You don't have enough credits");
    }
    toast.loading("Loading...");
    generateAI.mutate({
      prompt,
      credits: profile.data.credits - 5,
    });
  };
  return (
    <div className="mt-5 space-y-2 sm:mt-6">
      <button
        type="button"
        onClick={() => handleOnGenerateAI(descriptionRef.current?.value)}
        className="inline-flex w-full justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span>Use AI</span>
        <span className="flex items-center space-x-1">
          <span>(5</span>
          <TicketIcon className="h-5 w-5" />)
        </span>
      </button>
      <button
        type="submit"
        className="inline-flex w-full justify-center space-x-2 rounded-md px-3 py-2 text-sm font-semibold text-brand-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {edit ? (
          <span>Save</span>
        ) : (
          <>
            <span>Create</span>
            <span className="flex items-center space-x-1">
              <span>(1</span>
              <TicketIcon className="h-5 w-5" />)
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function Modal({
  open,
  post,
  setOpen,
}: {
  open: boolean;
  post: Post | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();
  const [friend, setFriend] = useState<Profile | null>(null);
  const [label, setLabel] = useState(post?.label ?? null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const onFileSelected = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as typeof event.target & {
      files: FileList;
    };
    const file = target.files[0];
    setAttachment(file);
  };
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
  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.fullName || !user?.username || !profile.data) return;
    const target = e.target as typeof e.target & {
      title: { value: string };
      label: { value: Label };
      description: { value: string };
    };
    if (target.label.value !== "PUBLIC" && target.label.value !== "PRIVATE")
      return toast("Please set a label for the post");
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
            label: target.label.value,
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
          label: target.label.value,
          title: target.title.value,
          description: target.description.value,
          friendId: friend?.id,
        });
      }
    } else {
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
            label: target.label.value,
            title: target.title.value,
            description: target.description.value,
            attachment: fileUrl,
            attachmentPath: filePath,
            authorId: user?.id,
            friendId: friend?.id,
            credits: profile.data.credits - 1,
          });
        } catch (e: any) {
          toast.dismiss();
          toast.error(e.message ?? API_ERROR_MESSAGE);
        }
      } else {
        createPost.mutate({
          label: target.label.value,
          title: target.title.value,
          description: target.description.value,
          authorId: user?.id,
          friendId: friend?.id,
          credits: profile.data.credits - 1,
        });
      }
    }
  };
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
                <Attachment
                  post={post}
                  attachment={attachment}
                  setOpen={setOpen}
                  setAttachment={setAttachment}
                />
                <form className="relative" onSubmit={handleOnSubmit}>
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
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
                      placeholder="Title"
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
                      required
                    />
                    <div aria-hidden="true">
                      <div className="py-2">
                        <div className="h-9" />
                      </div>
                      <div className="h-px" />
                      <div className="py-2">
                        <div className="py-px">
                          <div className="h-9" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-x-px bottom-0">
                    <div
                      className={clsx(
                        post?.attachment ? "justify-end" : "justify-between",
                        "flex items-center space-x-3 py-2 pl-2"
                      )}
                    >
                      {!post?.attachment ? (
                        <div className="flex">
                          <div className="group relative -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-brand-400">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0"
                              onChange={(event) => onFileSelected(event)}
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
                      ) : null}
                      <div className="flex flex-nowrap justify-end space-x-2 py-2">
                        <FriendDropdown
                          post={post}
                          friend={friend}
                          setFriend={setFriend}
                        />

                        <LabelDropdown
                          post={post}
                          label={label}
                          setLabel={setLabel}
                        />
                      </div>
                    </div>
                    <PostButtons
                      edit={!!post}
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
      utils.getInbox.invalidate();
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
  const profile = trpc.getProfile.useQuery();
  const createComment = trpc.createComment.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getInbox.invalidate();
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
          target.reset();
        },
      }
    );
  };
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
            required
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-end py-2 pl-3 pr-2">
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

export default function Inbox() {
  const { user } = useUser();
  const utils = trpc.useContext();
  const posts = trpc.getInbox.useQuery();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [post, setPost] = useState<Post | null>(null);
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
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnEditPost = (post: Post) => {
    setOpen(true);
    setPost(post);
  };
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
  return (
    <>
      <Modal open={open} post={post} setOpen={setOpen} />
      <div className="pb-36">
        <Navbar />
        <Header
          header="Scour through your digital inbox."
          search={search}
          setOpen={setOpen}
          setPost={setPost}
          setSearch={setSearch}
        />
        <div className="mt-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="w-full columns-xs gap-6 space-y-6">
              {posts.data
                ?.filter(
                  (post) =>
                    post.title.toLowerCase().includes(search.toLowerCase()) ||
                    post.description
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((item, index) => (
                  <div
                    key={index}
                    className="relative w-full break-inside-avoid-column"
                  >
                    <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                      <div className="space-y-6 text-brand-50">
                        {item.attachment ? (
                          <img
                            className="h-full w-full rounded-lg"
                            src={item.attachment}
                            alt="attachment"
                          />
                        ) : null}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg">{item.title}</h4>
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
                                    {item.authorId === user?.id ? (
                                      <>
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
                                      </>
                                    ) : null}
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={"/post/" + item.id}
                                          className={clsx(
                                            active
                                              ? "bg-brand-100 text-brand-900"
                                              : "text-brand-700",
                                            "block w-full px-4 py-2 text-left text-sm"
                                          )}
                                        >
                                          View post
                                        </Link>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                          <p>{item.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Dropdown item={item} />
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1 font-semibold">
                              <span>{item.author?.name}</span>
                              {item.author?.premium ? (
                                <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                              ) : null}
                            </div>
                            <div>{`@${item.author?.username}`}</div>
                          </div>
                        </div>
                        <div className="relative flex flex-col space-y-6">
                          <div className="flex space-x-6">
                            <Like item={item} />
                            <Comment item={item} />
                            <Bookmark item={item} />
                          </div>
                          <BookmarkCheck item={item} />
                          <Comments item={item} />

                          <CommentBox item={item} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
