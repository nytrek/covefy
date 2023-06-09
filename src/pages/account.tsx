import { Menu, Transition } from "@headlessui/react";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import Avatar from "@src/components/avatar";
import ProfileDetails from "@src/components/profiledetails";
import ProfileSkeleton from "@src/components/profileskeleton";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { toast } from "react-hot-toast";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

function ProfileButtons() {
  /**
   * @description hooks
   */
  const { reload } = useRouter();
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();

  /**
   * @description create board mutation that invokes an API call to a corresponding tRPC procedure
   */
  const createBoard = trpc.createBoard.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Board created!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the create board mutation @see createBoard
   */
  const handleCreateBoard = () => {
    if (!profile.data) return;
    toast.loading("Loading...");
    createBoard.mutate({
      name: "Board " + (profile.data.boards.length + 1),
      description:
        profile.data.name + "'s" + " Board " + (profile.data.boards.length + 1),
    });
  };

  /**
   * @description update profile mutation that invokes an API call to a corresponding tRPC procedure
   */
  const updateProfile = trpc.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Your profile has been set to " + data.label.toLowerCase());
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the update profile mutation @see updateProfile
   */
  const handleUpdateProfile = () => {
    toast.loading("Loading...");
    updateProfile.mutate({
      label: profile.data?.label === "PUBLIC" ? "PRIVATE" : "PUBLIC",
    });
  };

  /**
   * @description delete profile mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deleteProfile = trpc.deleteProfile.useMutation({
    onSuccess: () => {
      reload();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the delete profile mutation @see deleteProfile
   */
  const handleDeleteProfile = () => {
    toast.loading("Loading...");
    deleteProfile.mutate();
  };
  return (
    <div className="mt-6 flex w-full flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50">
            Manage account
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
          <Menu.Items className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none sm:w-56">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className={clsx(
                      active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                      "block w-full px-4 py-2 text-left text-sm"
                    )}
                  >
                    Delete profile
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={handleUpdateProfile}
                    className={clsx(
                      active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                      "block w-full px-4 py-2 text-left text-sm"
                    )}
                  >
                    Set profile to{" "}
                    {profile.data?.label === "PUBLIC" ? "private" : "public"}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      <button
        type="button"
        onClick={handleCreateBoard}
        className="inline-flex items-center justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Create board
      </button>
    </div>
  );
}

export default function Account() {
  /**
   * @description hooks
   */
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();

  /**
   * @description delete board mutation that invokes an API call to a corresponding tRPC procedure
   */
  const deleteBoard = trpc.deleteBoard.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Board deleted!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * @description event handler that triggers the delete board mutation @see deleteBoard
   */
  const handleDeleteBoard = (id: number) => {
    toast.loading("Loading...");
    deleteBoard.mutate({
      id,
    });
  };

  /**
   * @description event handler that copies the url of a board to clipboard
   */
  const handleShare = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied URL to clipboard");
  };
  return (
    <>
      <main className="pb-36 pt-12">
        <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="md:flex md:items-center md:justify-between md:space-x-5">
            <div className="flex w-full items-center space-x-5">
              <Avatar imageUrl={profile.data?.imageUrl} />
              {profile.data ? (
                <ProfileDetails profile={profile.data} />
              ) : (
                <div className="flex w-full items-center justify-between motion-safe:animate-pulse">
                  <div className="flex w-full flex-col space-y-3">
                    <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                    <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                  </div>
                </div>
              )}
            </div>
            <ProfileButtons />
          </div>
          <div className="space-y-4">
            <h3 className="text-base font-semibold leading-6 text-brand-50">
              Boards
            </h3>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {profile.data ? (
                <>
                  <div className="flex flex-col space-y-4">
                    <div className="relative">
                      <img
                        src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__8afdbf8e-6619-4141-8824-2935929db0bc.png"
                        alt="banner"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-2xl font-bold text-brand-50">
                              Default board
                            </h4>
                            <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
                          </div>
                          <p className="text-sm font-medium text-brand-500">
                            This is your default board
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <Link
                          href={"/board/d/" + profile.data.id}
                          className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
                        >
                          Visit
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            handleShare(
                              "https://www.covefy.com/board/d/" +
                                profile.data?.id
                            )
                          }
                          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                  {profile.data.boards.map((board) => (
                    <div key={board.id} className="flex flex-col space-y-4">
                      <div className="relative">
                        <img
                          src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__8afdbf8e-6619-4141-8824-2935929db0bc.png"
                          alt="banner"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <span className="absolute inset-0" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-5">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-2xl font-bold text-brand-50">
                                {board.name}
                              </h4>
                            </div>
                            <p className="text-sm font-medium text-brand-500">
                              {board.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 flex flex-col justify-stretch space-y-4">
                          <Link
                            href={"/board/b/" + board.id}
                            className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
                          >
                            Visit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteBoard(board.id)}
                            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <ProfileSkeleton />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
