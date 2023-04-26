import { useUser } from "@clerk/nextjs";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import {
  CheckBadgeIcon,
  PaperClipIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Profile } from "@prisma/client";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  FormEvent,
  Fragment,
  MutableRefObject,
  SetStateAction,
  useEffect,
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

function FriendDropdown({ friend }: { friend: Profile | null | undefined }) {
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
              <span className="ml-2 w-16 cursor-pointer truncate bg-transparent text-sm font-bold text-brand-500">
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
  setLength,
  descriptionRef,
}: {
  setLength: Dispatch<SetStateAction<number>>;
  descriptionRef: MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();
  const generateAI = trpc.generateAIResponse.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      utils.getProfile.invalidate();
      setLength((length) => data?.length ?? length);
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
  friend: Profile | null | undefined;
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
                    <PostButtons
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

function Header({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  const { user } = useUser();
  const utils = trpc.useContext();
  const { query } = useRouter();
  const id = query.id as string;
  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const recievingFriendStatus = trpc.getRecievingFriendStatus.useQuery(id);
  const createFriendRequest = trpc.createFriendRequest.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getFriends.invalidate();
      toast.success("Friend request sent!");
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
      utils.getFriends.invalidate();
      utils.getSendingFriendStatus.invalidate();
      utils.getRecievingFriendStatus.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnCreateFriendRequest = () => {
    if (!user?.id || !profile.data?.id) return;
    toast.loading("Loading...");
    createFriendRequest.mutate({
      senderId: user.id,
      recieverId: profile.data.id,
    });
  };
  const handleOnDeleteFriendRequest = (
    senderId?: string,
    recieverId?: string
  ) => {
    if (!senderId || !recieverId) return;
    toast.loading("Loading...");
    deleteFriendRequest.mutate({
      senderId,
      recieverId,
    });
  };
  return (
    <div className="md:flex md:items-center md:justify-between md:space-x-5">
      <div className="flex items-center space-x-5">
        <div className="flex-shrink-0">
          <div className="relative">
            {profile.data?.imageUrl ? (
              <img
                className="h-16 w-16 rounded-full"
                src={profile.data.imageUrl}
                alt=""
              />
            ) : (
              <span className="block h-16 w-16 rounded-full bg-brand-700"></span>
            )}
            <span
              className="absolute inset-0 rounded-full shadow-inner"
              aria-hidden="true"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-brand-50">
              {profile.data?.name}
            </h1>
            {profile.data?.premium ? (
              <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
            ) : null}
          </div>
          <p className="text-sm font-medium text-brand-500">
            @{profile.data?.username}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
        {sendingFriendStatus.data?.status === "PENDING" ||
        sendingFriendStatus.data?.status === "REJECTED" ? (
          <button
            type="button"
            onClick={() =>
              handleOnDeleteFriendRequest(
                sendingFriendStatus.data?.senderId,
                sendingFriendStatus.data?.receiverId
              )
            }
            className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
          >
            Delete friend request
          </button>
        ) : recievingFriendStatus.data?.status === "PENDING" ? (
          <button
            type="button"
            onClick={() =>
              handleOnDeleteFriendRequest(
                recievingFriendStatus.data?.senderId,
                recievingFriendStatus.data?.receiverId
              )
            }
            className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
          >
            Delete friend request
          </button>
        ) : sendingFriendStatus.data?.status === "ACCEPTED" ? (
          <button
            type="button"
            onClick={() =>
              handleOnDeleteFriendRequest(
                sendingFriendStatus.data?.senderId,
                sendingFriendStatus.data?.receiverId
              )
            }
            className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
          >
            Delete friend
          </button>
        ) : recievingFriendStatus.data?.status === "ACCEPTED" ? (
          <button
            type="button"
            onClick={() =>
              handleOnDeleteFriendRequest(
                recievingFriendStatus.data?.senderId,
                recievingFriendStatus.data?.receiverId
              )
            }
            className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
          >
            Delete friend
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
          >
            Report account
          </button>
        )}

        {sendingFriendStatus.data?.status === "PENDING" ||
        sendingFriendStatus.data?.status === "REJECTED" ? (
          <Link
            href="/friends"
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            View friend request
          </Link>
        ) : recievingFriendStatus.data?.status === "PENDING" ? (
          <Link
            href="/friends"
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            View friend request
          </Link>
        ) : recievingFriendStatus.data?.status === "REJECTED" ? (
          <button
            type="button"
            onClick={() =>
              handleOnDeleteFriendRequest(
                recievingFriendStatus.data?.senderId,
                recievingFriendStatus.data?.receiverId
              )
            }
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Delete friend request
          </button>
        ) : sendingFriendStatus.data?.status === "ACCEPTED" ||
          recievingFriendStatus.data?.status === "ACCEPTED" ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Send a note
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOnCreateFriendRequest}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Send friend request
          </button>
        )}
      </div>
    </div>
  );
}

function Stats() {
  const { query } = useRouter();
  const id = query.id as string;
  const likes = trpc.getLikes.useQuery(id);
  const profile = trpc.getProfile.useQuery(id);
  const comments = trpc.getComments.useQuery(id);
  const bookmarks = trpc.getBookmarks.useQuery(id);
  const stats = [
    {
      name: "Total Likes",
      stat:
        likes.data?.reduce((prev, curr) => prev + curr._count.likes, 0) ?? 0,
    },
    {
      name: "Total Comments",
      stat:
        comments.data?.reduce((prev, curr) => prev + curr._count.comments, 0) ??
        0,
    },
    {
      name: "Total Bookmarks",
      stat:
        bookmarks.data?.reduce(
          (prev, curr) => prev + curr._count.bookmarks,
          0
        ) ?? 0,
    },
  ];
  return (
    <div>
      <h3 className="text-base font-semibold leading-6 text-brand-50">
        {profile.data?.name}&apos;s stats
      </h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg border border-brand-600 bg-brand-800 px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-brand-500">
              {item.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-brand-50">
              {item.stat}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Account() {
  const { user } = useUser();
  const { query } = useRouter();
  const id = query.id as string;
  const [open, setOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const recievingFriendStatus = trpc.getRecievingFriendStatus.useQuery(id);
  const initializeAuthSession = async () => {
    try {
      await upload.beginAuthSession("/api/auth", async () => ({}));
      setIsAuth(true);
    } catch (err: any) {
      console.log(err.message);
    }
  };
  useEffect(() => {
    if (user) initializeAuthSession();
    else upload.endAuthSession();
  }, [user]);
  if (sendingFriendStatus.isLoading || recievingFriendStatus.isLoading)
    return <></>;
  return (
    <>
      <Modal open={open} friend={profile.data} setOpen={setOpen} />
      {isAuth && profile.data ? (
        <>
          {profile.data.label === "PUBLIC" ? (
            <main className="pb-36 pt-12">
              <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                <div className="relative">
                  <img
                    src={
                      profile.data.banner ??
                      "/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__6309b2fd-d55f-4753-9e85-d3dd965ee0c6.png"
                    }
                    alt="banner"
                    className="rounded-lg object-cover"
                  />
                </div>
                <Header setOpen={setOpen} />
                <Stats />
              </div>
            </main>
          ) : (
            <span className="flex h-[30rem] w-screen items-center justify-center text-white">
              This profile is not publicly accessible
            </span>
          )}
        </>
      ) : null}
    </>
  );
}
