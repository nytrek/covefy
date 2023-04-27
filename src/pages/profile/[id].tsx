import { useUser } from "@clerk/nextjs";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  CheckBadgeIcon,
  PaperClipIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Label, Profile } from "@prisma/client";
import Attachment from "@src/components/attachment";
import Avatar from "@src/components/avatar";
import LabelDropdown from "@src/components/labeldropdown";
import PostButtons from "@src/components/postbuttons";
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
  const [length, setLength] = useState(0);
  const [label, setLabel] = useState<Label | null>(null);
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
      utils.getInbox.invalidate();
      utils.getProfile.invalidate();
      toast.success("Post created!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

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
                  handleUpdate={() => null}
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
                    <div className="flex items-center justify-between space-x-3 py-2 pl-2">
                      {/**
                       * Render attachment button
                       */}
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

                      {/**
                       * Render friend tag
                       */}
                      <div className="flex flex-nowrap justify-end space-x-2 py-2">
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
                          </div>
                        </div>

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
                      edit={false}
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

function ProfileButtons({
  setOpen,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * router hook by next
   */
  const { push, query } = useRouter();
  const id = query.id as string;

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const recievingFriendStatus = trpc.getRecievingFriendStatus.useQuery(id);

  /**
   * create friend request mutation that links to corresponding procedure in the backend
   */
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

  /**
   * delete friend request mutation that links to corresponding procedure in the backend
   */
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

  /**
   * event handler for creating friend request
   */
  const handleOnCreateFriendRequest = () => {
    if (!user?.id || !profile.data?.id) return;
    toast.loading("Loading...");
    createFriendRequest.mutate({
      senderId: user.id,
      recieverId: profile.data.id,
    });
  };

  /**
   * event handler for deleting friend request
   */
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
  );
}

function ProfileDetails() {
  /**
   * router hook by next
   */
  const { query } = useRouter();
  const id = query.id as string;

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery(id);
  return (
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
  );
}

function Header({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  /**
   * router hook by next
   */
  const { query } = useRouter();
  const id = query.id as string;

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery(id);
  return (
    <div className="md:flex md:items-center md:justify-between md:space-x-5">
      <div className="flex items-center space-x-5">
        {/**
         * Render profile image
         */}
        <Avatar imageUrl={profile.data?.imageUrl} />

        {/**
         * Render profile details
         */}
        <ProfileDetails />
      </div>

      {/**
       * Render profile buttons
       */}
      <ProfileButtons setOpen={setOpen} />
    </div>
  );
}

function Stats() {
  /**
   * router hook by next
   */
  const { query } = useRouter();
  const id = query.id as string;

  /**
   * trpc queries
   */
  const likes = trpc.getLikes.useQuery(id);
  const profile = trpc.getProfile.useQuery(id);
  const comments = trpc.getComments.useQuery(id);
  const bookmarks = trpc.getBookmarks.useQuery(id);

  /**
   * profile stats
   */
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
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * useState that might be replaced with a state management library
   */
  const [open, setOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  /**
   * router hook by next
   */
  const { back, query } = useRouter();
  const id = query.id as string;

  /**
   * trpc queries
   */
  const profile = trpc.getProfile.useQuery(id);
  const sendingFriendStatus = trpc.getSendingFriendStatus.useQuery(id);
  const recievingFriendStatus = trpc.getRecievingFriendStatus.useQuery(id);

  /**
   * initialize auth session if user is authenticated to render private images from upload.io
   */
  const initializeAuthSession = async () => {
    try {
      await upload.beginAuthSession("/api/auth", async () => ({}));
      setIsAuth(true);
    } catch (err: any) {
      console.log(err.message);
    }
  };

  /**
   * useEffect hook for checking the state of the user
   */
  useEffect(() => {
    if (user) initializeAuthSession();
    else upload.endAuthSession();
  }, [user]);

  /**
   * render empty UI if the relationship status between the currrent logged in user and the URL requested user has not been established yet
   */
  if (sendingFriendStatus.isLoading || recievingFriendStatus.isLoading)
    return <></>;

  /**
   * render UI
   */
  return (
    <>
      <Modal open={open} friend={profile.data} setOpen={setOpen} />
      {isAuth && !!profile.data && (
        <>
          {profile.data.label === "PUBLIC" ? (
            <main className="pb-36 pt-12">
              <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
                {/**
                 * Render back button
                 */}
                <button
                  type="button"
                  onClick={() => back()}
                  className="flex items-center space-x-2 text-brand-50"
                >
                  <ArrowLongLeftIcon className="h-5 w-5" />
                  <span>Go back</span>
                </button>

                {/**
                 * Render banner image
                 */}
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

                {/**
                 * Render profile header
                 */}
                <Header setOpen={setOpen} />

                {/**
                 * Render profile stats
                 */}
                <Stats />
              </div>
            </main>
          ) : (
            <div className="flex h-[30rem] w-screen flex-col items-center justify-center space-y-6 text-brand-50">
              <button
                type="button"
                onClick={() => back()}
                className="flex items-center space-x-2"
              >
                <ArrowLongLeftIcon className="h-5 w-5" />
                <span>Go back</span>
              </button>
              <p>This profile is not publicly accessible</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
