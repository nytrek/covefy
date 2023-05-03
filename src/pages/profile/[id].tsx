import { useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Profile } from "@prisma/client";
import Avatar from "@src/components/avatar";
import LabelDropdown from "@src/components/labeldropdown";
import PostAttachment from "@src/components/postattachment";
import PostButtons from "@src/components/postbuttons";
import ProfileDetails from "@src/components/profiledetails";
import ProfileStats from "@src/components/profilestats";
import { trpc } from "@src/utils/trpc";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  FormEvent,
  Fragment,
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

interface Props {
  open: boolean;
  friend: Profile | null | undefined;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function Modal({ open, friend, setOpen }: Props) {
  const { user } = useUser();

  const utils = trpc.useContext();

  const [length, setLength] = useState(0);
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState<Label | null>(null);
  const [attachment, setAttachment] = useState<File | string | null>(null);

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
    if (profile.data.credits < 10)
      return toast.error("You don't have enough credits");
    generateAI.mutate({
      prompt: description,
      credits: profile.data.credits - 10,
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
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message ?? API_ERROR_MESSAGE);
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
    handleOnCreate(target.title.value, target.description.value);
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
                    <div className="flex items-center justify-between space-x-3 py-2 pl-1">
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
                      <div className="flex flex-nowrap justify-end space-x-2 py-2">
                        <div className="flex-shrink-0">
                          <div className="relative inline-flex items-center whitespace-nowrap rounded-full bg-brand-50 px-2 py-2 text-sm font-medium text-brand-500 hover:bg-brand-100 sm:px-3">
                            {friend?.imageUrl ? (
                              <img
                                src={friend.imageUrl}
                                alt="avatar"
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
                        <LabelDropdown label={label} setLabel={setLabel} />
                      </div>
                    </div>
                    <PostAttachment
                      attachment={attachment}
                      setAttachment={setAttachment}
                    />
                    <PostButtons
                      edit={false}
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

function ProfileButtons({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { user } = useUser();

  const utils = trpc.useContext();

  const { push, query } = useRouter();
  const id = query.id as string;

  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const receivingFriendStatus = trpc.getReceivingFriendStatus.useQuery(id);

  const createFriendRequest = trpc.createFriendRequest.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getFriends.invalidate();
      toast.success("Friend request sent!");
      utils.getSendingFriendStatus.invalidate();
      utils.getReceivingFriendStatus.invalidate();
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
      utils.getReceivingFriendStatus.invalidate();
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
      receiverId: profile.data.id,
    });
  };

  const handleOnDeleteFriendRequest = (
    senderId?: string,
    receiverId?: string
  ) => {
    if (!senderId || !receiverId) return;
    toast.loading("Loading...");
    deleteFriendRequest.mutate({
      senderId,
      receiverId,
    });
  };
  return (
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
      ) : receivingFriendStatus.data?.status === "PENDING" ? (
        <button
          type="button"
          onClick={() =>
            handleOnDeleteFriendRequest(
              receivingFriendStatus.data?.senderId,
              receivingFriendStatus.data?.receiverId
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
      ) : receivingFriendStatus.data?.status === "ACCEPTED" ? (
        <button
          type="button"
          onClick={() =>
            handleOnDeleteFriendRequest(
              receivingFriendStatus.data?.senderId,
              receivingFriendStatus.data?.receiverId
            )
          }
          className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
        >
          Delete friend
        </button>
      ) : (
        <button
          type="button"
          onClick={() => push("/feedback")}
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
      ) : receivingFriendStatus.data?.status === "PENDING" ? (
        <Link
          href="/friends"
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          View friend request
        </Link>
      ) : receivingFriendStatus.data?.status === "REJECTED" ? (
        <button
          type="button"
          onClick={() =>
            handleOnDeleteFriendRequest(
              receivingFriendStatus.data?.senderId,
              receivingFriendStatus.data?.receiverId
            )
          }
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Delete friend request
        </button>
      ) : sendingFriendStatus.data?.status === "ACCEPTED" ||
        receivingFriendStatus.data?.status === "ACCEPTED" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Send a post
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
  );
}

function Header({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  const { user } = useUser();

  const { query } = useRouter();
  const id = query.id as string;

  const profile = trpc.getProfile.useQuery(id);
  if (!profile.data) return <></>;
  return (
    <div className="md:flex md:items-center md:justify-between md:space-x-5">
      <div className="flex items-center space-x-5">
        <Avatar imageUrl={profile.data?.imageUrl} />
        <ProfileDetails profile={profile.data} />
      </div>
      {profile.data.id !== user?.id && <ProfileButtons setOpen={setOpen} />}
    </div>
  );
}

export default function Account() {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  const { back, query } = useRouter();
  const id = query.id as string;

  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const receivingFriendStatus = trpc.getReceivingFriendStatus.useQuery(id);
  const likes = trpc.getLikes.useQuery(id);
  const comments = trpc.getComments.useQuery(id);
  const bookmarks = trpc.getBookmarks.useQuery(id);

  const stats = [
    {
      name: "Total Likes",
      value:
        likes.data?.reduce((prev, curr) => prev + curr._count.likes, 0) ?? 0,
    },
    {
      name: "Total Comments",
      value:
        comments.data?.reduce((prev, curr) => prev + curr._count.comments, 0) ??
        0,
    },
    {
      name: "Total Bookmarks",
      value:
        bookmarks.data?.reduce(
          (prev, curr) => prev + curr._count.bookmarks,
          0
        ) ?? 0,
    },
  ];

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

  if (sendingFriendStatus.isLoading || receivingFriendStatus.isLoading)
    return <></>;
  return (
    <>
      <Modal open={open} friend={profile.data} setOpen={setOpen} />
      {isAuth && !!profile.data && (
        <>
          <main className="pb-36 pt-12">
            <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <button
                type="button"
                onClick={() => back()}
                className="flex items-center space-x-2 text-brand-50"
              >
                <ArrowLongLeftIcon className="h-5 w-5" />
                <span>Go back</span>
              </button>
              {profile.data.label === "PUBLIC" ||
              profile.data.id === user?.id ||
              profile.data.sender.length > 0 ||
              profile.data.receiver.length > 0 ? (
                <>
                  <div className="relative">
                    <img
                      src={
                        profile.data.banner ??
                        "/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__6309b2fd-d55f-4753-9e85-d3dd965ee0c6.png"
                      }
                      alt="banner"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  </div>
                  <Header setOpen={setOpen} />
                  <ProfileStats
                    stats={stats}
                    header={`${profile.data?.name}'s stats`}
                  />
                </>
              ) : (
                <p className="text-brand-50">
                  This profile is not publicly accessible
                </p>
              )}
            </div>
          </main>
        </>
      )}
    </>
  );
}
