import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Dialog, Listbox, Popover, Transition } from "@headlessui/react";
import {
  BookmarkIcon,
  ChartBarIcon,
  CheckIcon,
  HandThumbUpIcon,
  HomeIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  SwatchIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { Bars3Icon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Bookmark, Label, Like, Prisma } from "@prisma/client";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dispatch, FormEvent, Fragment, SetStateAction, useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "../utils/trpc";
import { Upload } from "upload-js";

type Post = Prisma.PostGetPayload<{
  include: {
    likes: true;
    bookmarks: true;
  };
}>;

const assignees = [
  { name: "Unassigned", value: null },
  {
    name: "Wade Cooper",
    value: "wade-cooper",
    avatar:
      "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  // More items...
];

function Modal({
  open,
  post,
  setOpen,
  setPost,
}: {
  open: boolean;
  post: Post | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setPost: Dispatch<SetStateAction<Post | null>>;
}) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const upload = Upload({
    apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
  });
  const [assigned, setAssigned] = useState(assignees[0]);
  const [labelled, setLabelled] = useState(post?.label ?? null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const createMutation = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      setLabelled(null);
      setAttachment(null);
      utils.getUserPosts.invalidate();
      toast.success("Post created!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const updateMutation = trpc.updatePost.useMutation({
    onSuccess: () => {
      setPost(null);
      setOpen(false);
      toast.dismiss();
      setLabelled(null);
      utils.getUserPosts.invalidate();
      toast.success("Post updated!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const deleteMutation = trpc.deletePost.useMutation({
    onSuccess: () => {
      toast.dismiss();
      //clear post state
      setPost(null);
      //close the modal
      setOpen(false);
      //clear the label
      setLabelled(null);
      //invalidate cache
      utils.getUserPosts.invalidate();
      //notification
      toast.success("Post deleted!");
    },
    onError: (err: any) => {
      toast.dismiss();
      //console out error
      console.log(err.message);
      //notification
      toast.error("API request failed, check console.log");
    },
  });
  const deleteAttachment = trpc.deleteAttachment.useMutation({
    onSuccess: () => {
      if (!post) return;
      deleteMutation.mutate({
        id: post.id,
      });
    },
    onError: (err: any) => {
      toast.dismiss();
      //console out error
      console.log(err.message);
      //notification
      toast.error("API request failed, check console.log");
    },
  });
  const onFileSelected = async (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as typeof event.target & {
      files: FileList;
    };
    const file = target.files[0];
    setAttachment(file);
  };
  const handleOnClick = () => {
    if (!post) return; //execute if the user has selected a post
    toast.loading("Loading...");
    if (post.attachmentPath) {
      deleteAttachment.mutate({
        attachmentPath: post.attachmentPath,
      });
    } else {
      deleteMutation.mutate({
        id: post.id,
      });
    }
  };
  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.fullName || !user?.username) return;
    const target = e.target as typeof e.target & {
      title: { value: string };
      label: { value: Label };
      description: { value: string };
    };
    if (target.label.value !== "PUBLIC" && target.label.value !== "PRIVATE")
      return toast("Please set a label for the post");
    toast.loading("Loading...");
    if (post) {
      updateMutation.mutate({
        id: post.id,
        label: target.label.value,
        title: target.title.value,
        description: target.description.value,
      });
    } else {
      if (attachment) {
        try {
          const { fileUrl, filePath } = await upload.uploadFile(attachment, {
            path: {
              // See path variables: https://upload.io/dashboard/docs/path-variables
              folderPath: "/uploads/{UTC_YEAR}/{UTC_MONTH}/{UTC_DAY}",
              fileName: "{UNIQUE_DIGITS_8}{ORIGINAL_FILE_EXT}",
            },
          });
          createMutation.mutate({
            label: target.label.value,
            title: target.title.value,
            description: target.description.value,
            attachment: fileUrl,
            attachmentPath: filePath,
            authorId: user?.id,
            authorName: user?.fullName,
            authorUsername: user?.username,
            authorProfileImageUrl: user?.profileImageUrl,
          });
        } catch (e: any) {
          toast.dismiss();
          toast.error(e.message);
        }
      } else {
        createMutation.mutate({
          label: target.label.value,
          title: target.title.value,
          description: target.description.value,
          authorId: user?.id,
          authorName: user?.fullName,
          authorUsername: user?.username,
          authorProfileImageUrl: user?.profileImageUrl,
        });
      }
    }
  };
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          setPost(null);
          setOpen(false);
          setLabelled(null);
        }}
      >
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
                {attachment ? (
                  <div className="relative">
                    <img
                      className="aspect-[1/1] h-full w-full rounded-lg"
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
                ) : null}
                <form className="relative" onSubmit={handleOnSubmit}>
                  <div className="overflow-hidden rounded-lg border border-brand-300 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                    <label htmlFor="title" className="sr-only">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full border-0 pt-2.5 text-lg font-medium placeholder:text-brand-400 focus:ring-0"
                      placeholder="Title"
                      defaultValue={post?.title}
                      maxLength={100}
                      required
                    />
                    <label htmlFor="description" className="sr-only">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      name="description"
                      id="description"
                      className="block w-full resize-none border-0 py-0 text-brand-900 placeholder:text-brand-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Write a description..."
                      defaultValue={post?.description}
                      maxLength={360}
                      required
                    />

                    {/* Spacer element to match the height of the toolbar */}
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
                    {/* Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. */}
                    <div className="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
                      {!post ? (
                        <Listbox
                          as="div"
                          value={assigned}
                          onChange={setAssigned}
                          className="flex-shrink-0"
                        >
                          {({ open }) => (
                            <>
                              <Listbox.Label className="sr-only">
                                {" "}
                                Assign{" "}
                              </Listbox.Label>
                              <div className="relative">
                                <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                                  {assigned.value === null ? (
                                    <UserCircleIcon
                                      className="h-5 w-5 flex-shrink-0 text-brand-300 sm:-ml-1"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <img
                                      src={assigned.avatar}
                                      alt=""
                                      className="h-5 w-5 flex-shrink-0 rounded-full"
                                    />
                                  )}

                                  <span
                                    className={clsx(
                                      assigned.value === null
                                        ? ""
                                        : "text-brand-900",
                                      "hidden truncate sm:ml-2 sm:block"
                                    )}
                                  >
                                    {assigned.value === null
                                      ? "Send to"
                                      : assigned.name}
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
                                    {assignees.map((assignee) => (
                                      <Listbox.Option
                                        key={assignee.value}
                                        className={({ active }) =>
                                          clsx(
                                            active
                                              ? "bg-brand-100"
                                              : "bg-brand-50",
                                            "relative cursor-default select-none px-3 py-2"
                                          )
                                        }
                                        value={assignee}
                                      >
                                        <div className="flex items-center">
                                          {assignee.avatar ? (
                                            <img
                                              src={assignee.avatar}
                                              alt=""
                                              className="h-5 w-5 flex-shrink-0 rounded-full"
                                            />
                                          ) : (
                                            <UserCircleIcon
                                              className="h-5 w-5 flex-shrink-0 text-brand-400"
                                              aria-hidden="true"
                                            />
                                          )}

                                          <span className="ml-3 block truncate font-medium">
                                            {assignee.name}
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
                      ) : null}

                      <Listbox
                        as="div"
                        value={labelled}
                        onChange={setLabelled}
                        className="flex-shrink-0"
                      >
                        {({ open }) => (
                          <>
                            <Listbox.Label className="sr-only">
                              {" "}
                              Add a label{" "}
                            </Listbox.Label>
                            <div className="relative">
                              <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                                <TagIcon
                                  className="h-5 w-5 flex-shrink-0 text-brand-500 sm:-ml-1"
                                  aria-hidden="true"
                                />
                                <input
                                  name="label"
                                  key={labelled}
                                  defaultValue={
                                    labelled
                                      ? labelled
                                      : post?.label
                                      ? post?.label
                                      : "Set label"
                                  }
                                  className="ml-2 w-16 cursor-pointer truncate bg-transparent text-brand-500"
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
                                      <span className="block truncate font-medium">
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
                                      <span className="block truncate font-medium">
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
                    </div>
                    <div
                      className={clsx(
                        post ? "justify-end" : "justify-between",
                        "flex items-center space-x-3 border-t border-brand-200 px-2 py-2 sm:px-3"
                      )}
                    >
                      {!post ? (
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
                      <div className="flex-shrink-0 space-x-1">
                        {post ? (
                          <>
                            <button
                              type="button"
                              onClick={handleOnClick}
                              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              Delete
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <button
                            type="submit"
                            className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                          >
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function Posts() {
  const { user } = useUser();
  const { route } = useRouter();
  const utils = trpc.useContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tabs = [
    { name: "My Account", href: "/account", current: route === "/account" },
    { name: "Ranking", href: "/ranking", current: route === "/ranking" },
    { name: "Friend list", href: "/friends", current: route === "/friends" },
    { name: "Billing", href: "#", current: route === "/billing" },
  ];
  const [post, setPost] = useState<Post | null>(null);
  const posts = trpc.getUserPosts.useQuery();
  const createLike = trpc.createLike.useMutation({
    onSuccess: () => {
      setPost(null);
      toast.dismiss();
      utils.getUserPosts.invalidate();
      toast.success("Post liked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const deleteLike = trpc.deleteLike.useMutation({
    onSuccess: () => {
      setPost(null);
      toast.dismiss();
      utils.getUserPosts.invalidate();
      toast.success("Post unliked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const createBookmark = trpc.createBookmark.useMutation({
    onSuccess: () => {
      setPost(null);
      toast.dismiss();
      utils.getUserPosts.invalidate();
      toast.success("Post bookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const deleteBookmark = trpc.deleteBookmark.useMutation({
    onSuccess: () => {
      setPost(null);
      toast.dismiss();
      utils.getUserPosts.invalidate();
      toast.success("Post unbookmarked!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const handleOnCreateLike = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createLike.mutate({
      postId: id,
      authorId: user?.id,
    });
  };
  const handleOnDeleteLike = (id: number) => {
    toast.loading("Loading...");
    deleteLike.mutate({
      id,
    });
  };
  const handleOnCreateBookmark = (id: number) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    createBookmark.mutate({
      postId: id,
      authorId: user?.id,
    });
  };
  const handleOnDeleteBookmark = (id: number) => {
    toast.loading("Loading...");
    deleteBookmark.mutate({
      id,
    });
  };
  return (
    <>
      <Modal open={open} post={post} setOpen={setOpen} setPost={setPost} />
      <div className="pb-36">
        <Popover as="header">
          {({ open }) => (
            <>
              <div className="px-4 py-4 sm:px-6 lg:px-8">
                <div className="relative flex justify-between">
                  <div className="flex space-x-10">
                    <div className="flex flex-shrink-0 items-center">
                      <SwatchIcon className="mx-auto h-8 w-8 text-brand-50" />
                    </div>
                    <div>
                      <div className="hidden lg:block">
                        <nav className="flex space-x-4" aria-label="Tabs">
                          {tabs.map((tab) => (
                            <Link
                              key={tab.name}
                              href={tab.href}
                              className={clsx(
                                tab.current
                                  ? "bg-brand-700 text-brand-50"
                                  : "text-brand-200 hover:text-gray-50",
                                "rounded-md px-3 py-2 text-sm font-medium"
                              )}
                              aria-current={tab.current ? "page" : undefined}
                            >
                              {tab.name}
                            </Link>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
                    {/* Mobile menu button */}
                    <Popover.Button className="-mx-2 inline-flex items-center justify-center rounded-md p-2 text-brand-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-50">
                      <span className="sr-only">Open menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Popover.Button>
                  </div>
                  <div className="hidden space-x-5 lg:flex lg:items-center lg:justify-end xl:col-span-4">
                    <Link
                      href="/plans"
                      className="text-sm font-medium text-brand-50 hover:underline"
                    >
                      Go Premium
                    </Link>
                    <a
                      href="#"
                      className="flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <p>30</p>
                      <TicketIcon className="h-6 w-6" aria-hidden="true" />
                    </a>

                    <div className="relative flex-shrink-0">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button
                            type="button"
                            className="flex items-center justify-center rounded-full bg-brand-600"
                          >
                            <UserCircleIcon className="h-8 w-8 text-brand-50" />
                          </button>
                        </SignInButton>
                      </SignedOut>

                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                  </div>
                </div>
              </div>

              <Popover.Panel as="nav" className="lg:hidden" aria-label="Global">
                <div className="pt-4">
                  <div className="mx-auto flex items-center px-4 sm:px-6">
                    <div className="flex-shrink-0">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button
                            type="button"
                            className="flex items-center justify-center rounded-full bg-brand-600"
                          >
                            <UserCircleIcon className="h-10 w-10 text-brand-50" />
                          </button>
                        </SignInButton>
                      </SignedOut>

                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-brand-50">
                        {user?.fullName}
                      </div>
                      <div className="text-sm font-medium text-brand-500">
                        {user?.username}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <p>30</p>
                      <TicketIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mx-auto mt-3 space-y-1 px-2 sm:px-4">
                    {tabs.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={clsx(
                          item.current ? "bg-brand-800" : "hover:bg-brand-800",
                          "block rounded-md px-3 py-2 text-base font-medium text-brand-50"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mx-auto mt-6 px-4 sm:px-6">
                  <a
                    href="#"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-base font-medium text-brand-50 shadow-sm hover:bg-brand-700"
                  >
                    Go premium
                  </a>
                </div>
              </Popover.Panel>
            </>
          )}
        </Popover>
        <div className="mx-auto mt-12 max-w-xl px-4 text-center">
          <p className="mt-2 text-3xl font-semibold text-brand-50">
            Personalize your content board and share your story.
          </p>
          <div className="mt-8 flex flex-1 justify-center">
            <div className="w-full px-2 lg:px-6">
              <label htmlFor="search" className="sr-only">
                Search projects
              </label>
              <div className="relative flex items-center text-brand-50">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
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
                {user ? (
                  <button type="button" onClick={() => setOpen(true)}>
                    <PencilSquareIcon className="absolute right-3 top-3 h-6 w-6" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 px-2 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="w-full columns-1 sm:columns-2 md:columns-3 lg:w-auto lg:columns-4 xl:columns-5">
              {posts.data
                ?.filter(
                  (post) =>
                    post.title.toLowerCase().includes(search.toLowerCase()) ||
                    post.description
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((item, index) => (
                  <div key={index} className="relative w-full px-4 py-6">
                    <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.authorId === user?.id) {
                            setOpen(true);
                            setPost(item as unknown as Post);
                          }
                        }}
                        className="absolute inset-0 rounded-2xl"
                      ></button>
                      <div className="space-y-6 text-brand-50">
                        {item.attachment ? (
                          <img
                            className="aspect-[1/1] h-full w-full rounded-lg"
                            src={item.attachment}
                            alt="attachment"
                          />
                        ) : null}
                        <div className="space-y-4">
                          <h4 className="text-lg">{item.title}</h4>
                          <p>{item.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <img
                            className="h-10 w-10 rounded-full bg-brand-700"
                            src={item.authorProfileImageUrl}
                            alt=""
                          />
                          <div className="flex flex-col">
                            <div className="font-semibold">
                              {item.authorName}
                            </div>
                            <div>{`@${item.authorUsername}`}</div>
                          </div>
                        </div>
                        <div className="relative flex flex-col space-y-6">
                          <div className="flex space-x-6">
                            <span className="inline-flex items-center text-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  !!item.likes.find(
                                    (post: Like) => post.authorId === user?.id
                                  )?.id
                                    ? handleOnDeleteLike(
                                        item.likes.find(
                                          (post: Like) =>
                                            post.authorId === user?.id
                                        )?.id as number
                                      )
                                    : handleOnCreateLike(item.id);
                                }}
                                className="inline-flex space-x-2"
                              >
                                <HandThumbUpIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                                <span className="font-medium">
                                  {item.likes.length}
                                </span>
                                <span className="sr-only">likes</span>
                              </button>
                            </span>
                            <span className="inline-flex items-center text-sm">
                              <button
                                type="button"
                                className="inline-flex space-x-2"
                              >
                                <ChartBarIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                                <span className="font-medium">
                                  {item.likes.length + item.bookmarks.length}
                                </span>
                                <span className="sr-only">stats</span>
                              </button>
                            </span>
                            <span className="inline-flex items-center text-sm">
                              <button
                                type="button"
                                onClick={() => {
                                  !!item.bookmarks.find(
                                    (post: Bookmark) =>
                                      post.authorId === user?.id
                                  )?.id
                                    ? handleOnDeleteBookmark(
                                        item.bookmarks.find(
                                          (post: Bookmark) =>
                                            post.authorId === user?.id
                                        )?.id as number
                                      )
                                    : handleOnCreateBookmark(item.id);
                                }}
                                className="inline-flex space-x-2"
                              >
                                <BookmarkIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                                <span className="font-medium">
                                  {item.bookmarks.length}
                                </span>
                                <span className="sr-only">bookmarks</span>
                              </button>
                            </span>
                          </div>
                          {item.bookmarks.find(
                            (post) => post.authorId === user?.id
                          ) ? (
                            <div className="flex text-sm">
                              <span className="inline-flex items-center text-sm">
                                <button
                                  type="button"
                                  className="inline-flex space-x-2"
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                  <span className="font-medium">
                                    Bookmarked
                                  </span>
                                </button>
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
        <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
          <Link href="/" className="border border-transparent p-2">
            <HomeIcon className="h-8 w-8 rounded-full text-brand-50/40" />
          </Link>
          <Link
            href="/posts"
            className="rounded-full border border-brand-base bg-brand-800 p-2"
          >
            <RectangleStackIcon className="h-8 w-8 text-brand-50/70" />
          </Link>
          <Link href="/bookmarks" className="border border-transparent p-2">
            <BookmarkIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
          <Link href="/inbox" className="border border-transparent p-2">
            <InboxStackIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
        </div>
      </div>
    </>
  );
}
