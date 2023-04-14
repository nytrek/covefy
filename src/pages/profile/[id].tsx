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
import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  FormEvent,
  Fragment,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";

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
  const profile = trpc.getProfile.useQuery();
  const [labelled, setLabelled] = useState(null);
  const upload = Upload({
    apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
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
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const createMutation = trpc.createPost.useMutation({
    onSuccess: () => {
      setOpen(false);
      toast.dismiss();
      setLabelled(null);
      setAttachment(null);
      utils.getInbox.invalidate();
      utils.getProfile.invalidate();
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
  const handleOnGenerateAI = (prompt: string | undefined) => {
    if (!prompt || !profile.data) return;
    if (profile.data.credits < 1)
      return toast.error("You don't have enough credit");
    toast.loading("Loading...");
    generateAI.mutate({
      prompt,
      credits: profile.data.credits - 1,
    });
  };
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
    if (profile.data.credits < 1)
      return toast.error("You don't have enough credit");
    else if (attachment) {
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
          credits: profile.data.credits - 1,
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
        credits: profile.data.credits - 1,
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
                      rows={10}
                      ref={descriptionRef}
                      name="description"
                      id="description"
                      className="block w-full resize-none border-0 py-0 text-brand-900 placeholder:text-brand-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="Write a description or a prompt for the AI generation"
                      maxLength={720}
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
                    onClick={() =>
                      handleOnGenerateAI(descriptionRef.current?.value)
                    }
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

export default function Account() {
  const { user } = useUser();
  const { query } = useRouter();
  const id = query.id as string;
  const utils = trpc.useContext();
  const [open, setOpen] = useState(false);
  const likes = trpc.getLikes.useQuery(id);
  const profile = trpc.getProfile.useQuery(id);
  const bookmarks = trpc.getBookmarks.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const recievingFriendStatus = trpc.getRecievingFriendStatus.useQuery(id);
  const createFriendRequest = trpc.createFriendRequest.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Friend request sent!");
      utils.getSendingFriendStatus.invalidate();
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
      toast.success("Friend request deleted!");
      utils.getFriends.invalidate();
      utils.getSendingFriendStatus.invalidate();
      utils.getRecievingFriendStatus.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      console.log(err.message);
      toast.error("API request failed, check console.log");
    },
  });
  const stats = [
    {
      name: "Total Likes",
      stat:
        likes.data?.reduce((prev, curr) => prev + curr._count.likes, 0) ?? 0,
    },
    {
      name: "Total Stats",
      stat:
        (likes.data?.reduce((prev, curr) => prev + curr._count.likes, 0) ?? 0) +
        (bookmarks.data?.reduce(
          (prev, curr) => prev + curr._count.bookmarks,
          0
        ) ?? 0),
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
    <>
      <Modal open={open} friend={profile.data} setOpen={setOpen} />
      <Navbar />
      {profile.data ? (
        <main className="pb-36 pt-12">
          <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="md:flex md:items-center md:justify-between md:space-x-5">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  <div className="relative">
                    {profile.data?.imageUrl ? (
                      <img
                        className="h-16 w-16 rounded-full"
                        src={profile.data?.imageUrl}
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
                      {profile.data.name}
                    </h1>
                    {profile.data.premium ? (
                      <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-brand-500">
                    @{profile.data.username}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
                {recievingFriendStatus.data?.status === "PENDING" ||
                sendingFriendStatus.data?.status === "ACCEPTED" ||
                recievingFriendStatus.data?.status ===
                  "ACCEPTED" ? null : sendingFriendStatus.data?.status ===
                  "PENDING" ? (
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
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
                  >
                    Report account
                  </button>
                )}

                {sendingFriendStatus.data?.status === "PENDING" ||
                sendingFriendStatus.data?.status ===
                  "REJECTED" ? null : recievingFriendStatus.data?.status ===
                  "PENDING" ? (
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
            <div>
              <h3 className="text-base font-semibold leading-6 text-brand-50">
                {profile.data.name}&apos;s progress
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
          </div>
        </main>
      ) : null}
      <Footer />
    </>
  );
}
