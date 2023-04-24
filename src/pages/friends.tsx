import { useUser } from "@clerk/nextjs";
import { Dialog, Listbox, Menu, Transition } from "@headlessui/react";
import {
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  RectangleStackIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { ClockIcon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Prisma, Profile, Status } from "@prisma/client";
import Header from "@src/components/header";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
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
import { trpc } from "../utils/trpc";

const MAX_TOKENS = 720;
const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

type Friend = Prisma.FriendGetPayload<{
  include: {
    sender: {
      include: {
        posts: true;
      };
    };
    receiver: {
      include: {
        posts: true;
      };
    };
  };
}>;

function Attachment({
  attachment,
  setAttachment,
}: {
  attachment: File | null;
  setAttachment: Dispatch<SetStateAction<File | null>>;
}) {
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
      ) : null}
    </>
  );
}

function FriendDropdown({ friend }: { friend: Profile | null }) {
  return (
    <>
      {friend ? (
        <div className="flex-shrink-0">
          <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
            {friend.imageUrl ? (
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
          </div>
        </div>
      ) : null}
    </>
  );
}

function LabelDropdown({
  label,
  setLabel,
}: {
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
              <span className="mx-1 w-16 cursor-pointer truncate bg-transparent text-sm font-bold text-brand-500">
                {label ?? "Set label"}
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
  descriptionRef,
}: {
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
    <div className="mt-5 space-y-2 pl-2 pr-3.5 sm:mt-6">
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
        <span>Create</span>
        <span className="flex items-center space-x-1">
          <span>(1</span>
          <TicketIcon className="h-5 w-5" />)
        </span>
      </button>
    </div>
  );
}

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
  const [length, setLength] = useState(0);
  const profile = trpc.getProfile.useQuery();
  const [label, setLabel] = useState<Label | null>(null);
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
  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.fullName || !user?.username || !profile.data) return;
    const target = e.target as typeof e.target & {
      title: { value: string };
      description: { value: string };
    };
    if (!label) return toast("Please set a label for the post");
    toast.loading("Loading...");
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
        label,
        title: target.title.value,
        description: target.description.value,
        authorId: user?.id,
        friendId: friend?.id,
        credits: profile.data.credits - 1,
      });
    }
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
                <Attachment
                  attachment={attachment}
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
                      placeholder="Title (100 char)"
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
                    <div className="flex items-center justify-between space-x-3 py-2 pl-2">
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
                      <div className="flex flex-nowrap justify-end space-x-2 py-2">
                        <FriendDropdown friend={friend} />

                        <LabelDropdown label={label} setLabel={setLabel} />
                      </div>
                    </div>
                    <PostButtons descriptionRef={descriptionRef} />
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

function Dropdown({
  item,
  setOpen,
  setFriend,
}: {
  item: Friend;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
}) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const updateFriendStatus = trpc.updateFriendStatus.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getAllFriends.invalidate();
      toast.success("Friend request updated!");
      utils.getSendingFriendStatus.invalidate();
      utils.getRecievingFriendStatus.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
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
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
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
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full text-brand-400 hover:text-brand-200">
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
            {item.senderId === user?.id ? (
              <>
                {item.status === "PENDING" || item.status === "REJECTED" ? (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() =>
                          handleOnDelete(item.senderId, item.receiverId)
                        }
                        className={clsx(
                          active
                            ? "bg-brand-100 text-brand-900"
                            : "text-brand-700",
                          "w-full px-4 py-2 text-left text-sm"
                        )}
                      >
                        Delete request
                      </button>
                    )}
                  </Menu.Item>
                ) : (
                  <>
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
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() =>
                            handleOnDelete(item.senderId, item.receiverId)
                          }
                          className={clsx(
                            active
                              ? "bg-brand-100 text-brand-900"
                              : "text-brand-700",
                            "w-full px-4 py-2 text-left text-sm"
                          )}
                        >
                          Delete friend
                        </button>
                      )}
                    </Menu.Item>
                  </>
                )}
              </>
            ) : (
              <>
                {item.status === "PENDING" ? (
                  <>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() =>
                            handleOnUpdate(item.senderId, "ACCEPTED")
                          }
                          className={clsx(
                            active
                              ? "bg-brand-100 text-brand-900"
                              : "text-brand-700",
                            "w-full px-4 py-2 text-left text-sm"
                          )}
                        >
                          Accept request
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() =>
                            handleOnUpdate(item.senderId, "REJECTED")
                          }
                          className={clsx(
                            active
                              ? "bg-brand-100 text-brand-900"
                              : "text-brand-700",
                            "w-full px-4 py-2 text-left text-sm"
                          )}
                        >
                          Reject request
                        </button>
                      )}
                    </Menu.Item>
                  </>
                ) : item.status === "ACCEPTED" ? (
                  <>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(true);
                            setFriend(
                              item.senderId === user?.id
                                ? item.receiver
                                : item.sender
                            );
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
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() =>
                            handleOnDelete(item.senderId, item.receiverId)
                          }
                          className={clsx(
                            active
                              ? "bg-brand-100 text-brand-900"
                              : "text-brand-700",
                            "w-full px-4 py-2 text-left text-sm"
                          )}
                        >
                          Delete friend
                        </button>
                      )}
                    </Menu.Item>
                  </>
                ) : (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() =>
                          handleOnDelete(item.senderId, item.receiverId)
                        }
                        className={clsx(
                          active
                            ? "bg-brand-100 text-brand-900"
                            : "text-brand-700",
                          "w-full px-4 py-2 text-left text-sm"
                        )}
                      >
                        Delete request
                      </button>
                    )}
                  </Menu.Item>
                )}
              </>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function DescriptionList({
  item,
  setOpen,
  setFriend,
}: {
  item: Friend;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setFriend: Dispatch<SetStateAction<Profile | null>>;
}) {
  const { user } = useUser();
  return (
    <dl className="flex flex-wrap">
      <div className="flex-auto pl-6 pt-6">
        {item.status === "PENDING" ? (
          <>
            {item.senderId === user?.id ? (
              <dt className="text-sm font-semibold leading-6 text-brand-50">
                Friend request sent
              </dt>
            ) : (
              <dt className="text-sm font-semibold leading-6 text-brand-50">
                Friend request received
              </dt>
            )}
          </>
        ) : item.status === "ACCEPTED" ? (
          <dt className="text-sm font-semibold leading-6 text-brand-50">
            Friend request accepted
          </dt>
        ) : (
          <dt className="text-sm font-semibold leading-6 text-brand-50">
            Friend request rejected
          </dt>
        )}
        <dd className="mt-1 flex items-center space-x-2 text-base font-semibold leading-6 text-brand-50">
          <span>
            {formatDistanceToNow(item.updatedAt, {
              addSuffix: true,
            })}
          </span>
          <ClockIcon className="h-5 w-5" />
        </dd>
      </div>
      <div className="flex-none self-end px-6 pt-4">
        <dt className="sr-only">Options</dt>
        <Dropdown item={item} setOpen={setOpen} setFriend={setFriend} />
      </div>
      {item.senderId === user?.id ? (
        <>
          <div className="mt-6 flex w-full flex-none items-center gap-x-4 border-t border-brand-600 px-6 pt-6">
            <dt className="flex-none">
              {item.receiver.imageUrl ? (
                <img
                  src={item.receiver.imageUrl}
                  alt=""
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </dt>
            <dd className="flex items-center space-x-1 text-sm font-medium leading-6 text-brand-50">
              <span>{item.receiver.name}</span>
              {item.receiver.premium ? (
                <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
              ) : null}
            </dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Posts</span>
              <RectangleStackIcon
                className="h-6 w-5 text-brand-50"
                aria-hidden="true"
              />
            </dt>
            <dd className="text-sm leading-6 text-brand-50">
              <p>{item.receiver.posts.length}</p>
            </dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Credits</span>
              <TicketIcon
                className="h-6 w-5 text-brand-50"
                aria-hidden="true"
              />
            </dt>
            <dd className="text-sm leading-6 text-brand-50">
              <p>{item.receiver.credits}</p>
            </dd>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 flex w-full flex-none items-center gap-x-4 border-t border-brand-600 px-6 pt-6">
            <dt className="flex-none">
              {item.sender.imageUrl ? (
                <img
                  src={item.sender.imageUrl}
                  alt=""
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </dt>
            <dd className="flex items-center space-x-1 text-sm font-medium leading-6 text-brand-50">
              <span>{item.sender.name}</span>
              {item.sender.premium ? (
                <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
              ) : null}
            </dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Posts</span>
              <RectangleStackIcon
                className="h-6 w-5 text-brand-50"
                aria-hidden="true"
              />
            </dt>
            <dd className="text-sm leading-6 text-brand-50">
              <p>{item.sender.posts.length}</p>
            </dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Credits</span>
              <TicketIcon
                className="h-6 w-5 text-brand-50"
                aria-hidden="true"
              />
            </dt>
            <dd className="text-sm leading-6 text-brand-50">
              <p>{item.sender.credits}</p>
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}

function Cta({ item }: { item: Friend }) {
  const { user } = useUser();
  return (
    <>
      {item.senderId === user?.id ? (
        <div className="mt-6 border-t border-brand-600 px-6 py-6">
          <Link
            href={"/profile/" + item.receiverId}
            className="text-sm font-semibold leading-6 text-brand-50"
          >
            View profile <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      ) : (
        <div className="mt-6 border-t border-brand-600 px-6 py-6">
          <Link
            href={"/profile/" + item.senderId}
            className="text-sm font-semibold leading-6 text-brand-50"
          >
            View profile <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default function Friends() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const friends = trpc.getAllFriends.useQuery();
  const [friend, setFriend] = useState<Profile | null>(null);
  return (
    <>
      <Modal open={open} friend={friend} setOpen={setOpen} />
      <div className="pb-36">
        <Header
          header="Manage your friend requests."
          search={search}
          setOpen={setOpen}
          setPost={() => null}
          setSearch={setSearch}
        />
        <div className="mt-8 px-2 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="grid w-full grid-cols-1 gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {friends.data
                ?.filter(
                  (friend) =>
                    friend.sender.name
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    friend.receiver.name
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((item, index) => (
                  <div key={index} className="px-4">
                    <h2 className="sr-only">Summary</h2>
                    <div className="rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                      <DescriptionList
                        item={item}
                        setOpen={setOpen}
                        setFriend={setFriend}
                      />
                      <Cta item={item} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
