import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Dialog, Listbox, Menu, Popover, Transition } from "@headlessui/react";
import {
  ArchiveBoxIcon,
  BookmarkIcon,
  CheckBadgeIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  HomeIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  RectangleStackIcon,
  SwatchIcon,
  TagIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { Bars3Icon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Profile, Status } from "@prisma/client";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dispatch, FormEvent, Fragment, SetStateAction, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";
import { trpc } from "../utils/trpc";

function Modal({
  open,
  friend,
  setOpen,
}: {
  open: boolean;
  friend: Profile | null;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const upload = Upload({
    apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
  });
  const [labelled, setLabelled] = useState(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const createMutation = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      setLabelled(null);
      setAttachment(null);
      utils.getInbox.invalidate();
      toast.success("Post created!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
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
          friendId: friend?.id,
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
        friendId: friend?.id,
      });
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
                  <div className="overflow-hidden rounded-lg">
                    <label htmlFor="title" className="sr-only">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full border-0 pt-2.5 text-lg font-medium placeholder:text-brand-400 focus:ring-0"
                      placeholder="Title"
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
                      placeholder="Write a description or a prompt for the AI generation"
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
                      <div className="flex-shrink-0">
                        <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                          {friend?.imageUrl ? (
                            <img
                              src={friend.imageUrl}
                              alt=""
                              className="h-5 w-5 flex-shrink-0 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon
                              className="h-5 w-5 flex-shrink-0 text-brand-300 sm:-ml-1"
                              aria-hidden="true"
                            />
                          )}

                          <span className="ml-2 block truncate text-brand-900">
                            {friend?.name}
                          </span>
                        </div>
                      </div>
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
                                    labelled ? labelled : "Set label"
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
                    <div className="flex items-center justify-between space-x-3 px-2 py-2 sm:px-3">
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
                      <div className="flex-shrink-0 space-x-1">
                        <button
                          type="submit"
                          className="inline-flex items-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                        >
                          <span>Create</span>
                          <span className="flex items-center space-x-1">
                            <span>(1</span>
                            <TicketIcon className="h-5 w-5" />)
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="mt-5 space-y-2 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <span>Use AI</span>
                    <span className="flex items-center space-x-1">
                      <span>(1</span>
                      <TicketIcon className="h-5 w-5" />)
                    </span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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

export default function Friends() {
  const { user } = useUser();
  const { route } = useRouter();
  const utils = trpc.useContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profile = trpc.getProfile.useQuery();
  const friends = trpc.getAllFriends.useQuery();
  const [friend, setFriend] = useState<Profile | null>(null);
  const updateFriendStatus = trpc.updateFriendStatus.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getAllFriends.invalidate();
      toast.success("Friend request updated!");
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const deleteFriendRequest = trpc.deleteFriendRequest.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Deleted!");
      utils.getAllFriends.invalidate();
      utils.getSendingFriendStatus.invalidate();
      utils.getRecievingFriendStatus.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const tabs = [
    { name: "My Account", href: "/account", current: route === "/account" },
    { name: "Friend list", href: "/friends", current: route === "/friends" },
    { name: "Billing", href: "/billing", current: route === "/billing" },
    { name: "Support", href: "/support", current: route === "/support" },
  ];
  const handleOnUpdate = (id: string, status: Status) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    updateFriendStatus.mutate({
      senderId: id,
      recieverId: user?.id,
      status,
    });
  };
  const handleOnDelete = (senderId: string, recieverId: string) => {
    if (!senderId || !recieverId) return;
    toast.loading("Loading...");
    deleteFriendRequest.mutate({
      senderId,
      recieverId,
    });
  };
  return (
    <>
      <Modal open={open} setOpen={setOpen} friend={friend} />
      <div className="pb-36">
        <Popover as="header">
          {({ open }) => (
            <>
              <div className="px-4 py-4 sm:px-6 lg:px-8">
                <div className="relative flex justify-between">
                  <div className="flex space-x-10">
                    <Link href="/" className="flex flex-shrink-0 items-center">
                      <SwatchIcon className="mx-auto h-8 w-8 text-brand-50" />
                    </Link>
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
                      href="/pricing"
                      className="text-sm font-medium text-brand-50 hover:underline"
                    >
                      Go Premium
                    </Link>
                    {user ? (
                      <a
                        href="#"
                        className="flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                      >
                        <span className="sr-only">View notifications</span>
                        <p>{profile.data?.credits}</p>
                        <TicketIcon className="h-6 w-6" aria-hidden="true" />
                      </a>
                    ) : null}

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
                    {user ? (
                      <button
                        type="button"
                        className="ml-auto flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                      >
                        <span className="sr-only">View notifications</span>
                        <p>{profile.data?.credits}</p>
                        <TicketIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    ) : null}
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
            Find your accepted, rejected and pending friend requests.
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
                  className="block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 py-3 pl-10 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
                  placeholder="Search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {user ? (
          <div className="mt-8 px-2 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="w-full columns-1 sm:columns-2 md:columns-3 lg:w-auto lg:columns-4 xl:columns-5">
                {friends.data
                  ?.filter((friend) =>
                    friend.sender.name
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((item, index) => (
                    <div key={index} className="relative w-full px-4 py-6">
                      <div className="relative rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                        <button
                          type="button"
                          className="absolute inset-0 rounded-2xl"
                        ></button>
                        <div className="space-y-6 text-brand-50">
                          {item.senderId === user?.id ? (
                            <>
                              <div className="space-y-4">
                                <h4 className="text-lg">
                                  {item.receiver.name}
                                </h4>
                                {item.status === "ACCEPTED" ? (
                                  <p>has accepted your friend request</p>
                                ) : (
                                  <p>has recieved your friend request</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <Menu
                                  as="div"
                                  className="relative inline-block text-left"
                                >
                                  <div>
                                    <Menu.Button className="flex items-center rounded-full bg-brand-100 text-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-100">
                                      {item.receiver?.imageUrl ? (
                                        <img
                                          className="h-10 w-10 rounded-full"
                                          src={item.receiver?.imageUrl}
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
                                              href={
                                                "/profile/" + item.receiverId
                                              }
                                              className={clsx(
                                                active
                                                  ? "bg-brand-100 text-brand-900"
                                                  : "text-brand-700",
                                                "block px-4 py-2 text-sm"
                                              )}
                                            >
                                              View profile
                                            </Link>
                                          )}
                                        </Menu.Item>
                                        {item.status === "ACCEPTED" ? (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpen(true);
                                                  setFriend(item.receiver);
                                                }}
                                                className={clsx(
                                                  active
                                                    ? "bg-brand-100 text-brand-900"
                                                    : "text-brand-700",
                                                  "w-full px-4 py-2 text-left text-sm"
                                                )}
                                              >
                                                Send a note
                                              </button>
                                            )}
                                          </Menu.Item>
                                        ) : null}
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-1 font-semibold">
                                    <span>{item.receiver.name}</span>
                                    {item.receiver?.premium ? (
                                      <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                                    ) : null}
                                  </div>
                                  <div>{`@${item.receiver?.username}`}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-4">
                                <h4 className="text-lg">{item.sender.name}</h4>
                                {item.status === "ACCEPTED" ? (
                                  <p>has been added to your friend list</p>
                                ) : (
                                  <p>has sent you a friend request</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <Menu
                                  as="div"
                                  className="relative inline-block text-left"
                                >
                                  <div>
                                    <Menu.Button className="flex items-center rounded-full bg-brand-100 text-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-100">
                                      {item.sender?.imageUrl ? (
                                        <img
                                          className="h-10 w-10 rounded-full"
                                          src={item.sender?.imageUrl}
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
                                              href={"/profile/" + item.senderId}
                                              className={clsx(
                                                active
                                                  ? "bg-brand-100 text-brand-900"
                                                  : "text-brand-700",
                                                "block px-4 py-2 text-sm"
                                              )}
                                            >
                                              View profile
                                            </Link>
                                          )}
                                        </Menu.Item>
                                        {item.status === "ACCEPTED" ? (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpen(true);
                                                  setFriend(item.sender);
                                                }}
                                                className={clsx(
                                                  active
                                                    ? "bg-brand-100 text-brand-900"
                                                    : "text-brand-700",
                                                  "w-full px-4 py-2 text-left text-sm"
                                                )}
                                              >
                                                Send a note
                                              </button>
                                            )}
                                          </Menu.Item>
                                        ) : null}
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-1 font-semibold">
                                    <span>{item.sender.name}</span>
                                    {item.sender?.premium ? (
                                      <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                                    ) : null}
                                  </div>
                                  <div>{`@${item.sender?.username}`}</div>
                                </div>
                              </div>
                            </>
                          )}
                          <div className="relative flex flex-col space-y-6">
                            {item.senderId === user?.id ? (
                              <>
                                {item.status === "PENDING" ||
                                item.status === "REJECTED" ? (
                                  <div className="flex text-sm">
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOnDelete(
                                            item.senderId,
                                            item.receiverId
                                          )
                                        }
                                        className="inline-flex space-x-2"
                                      >
                                        <TrashIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          Delete request
                                        </span>
                                      </button>
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex text-sm">
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOnDelete(
                                            item.senderId,
                                            item.receiverId
                                          )
                                        }
                                        className="inline-flex space-x-2"
                                      >
                                        <TrashIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          Delete friend
                                        </span>
                                      </button>
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {item.status === "PENDING" ? (
                                  <div className="flex space-x-6">
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOnUpdate(
                                            item.senderId,
                                            "ACCEPTED"
                                          )
                                        }
                                        className="inline-flex space-x-2"
                                      >
                                        <HandThumbUpIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          Accept
                                        </span>
                                        <span className="sr-only">accept</span>
                                      </button>
                                    </span>
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOnUpdate(
                                            item.senderId,
                                            "REJECTED"
                                          )
                                        }
                                        className="inline-flex space-x-2"
                                      >
                                        <HandThumbDownIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          Reject
                                        </span>
                                        <span className="sr-only">reject</span>
                                      </button>
                                    </span>
                                  </div>
                                ) : item.status === "ACCEPTED" ? (
                                  <div className="flex text-sm">
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOnDelete(
                                            item.senderId,
                                            item.receiverId
                                          )
                                        }
                                        className="inline-flex space-x-2"
                                      >
                                        <TrashIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          Delete friend
                                        </span>
                                      </button>
                                    </span>
                                  </div>
                                ) : item.status === "REJECTED" ? (
                                  <div className="flex text-sm">
                                    <span className="inline-flex items-center text-sm">
                                      <button
                                        type="button"
                                        className="inline-flex space-x-2"
                                      >
                                        <ArchiveBoxIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                        <span className="font-medium">
                                          {item.status}
                                        </span>
                                      </button>
                                    </span>
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
        <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
          <Link href="/" className="border border-transparent p-2">
            <HomeIcon className="h-8 w-8 rounded-full text-brand-50/40" />
          </Link>
          <Link href="/posts" className="border border-transparent p-2">
            <RectangleStackIcon className="h-8 w-8 text-brand-50/40" />
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
