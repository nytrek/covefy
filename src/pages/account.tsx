import { Menu, Transition } from "@headlessui/react";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import Avatar from "@src/components/avatar";
import ProfileDetails from "@src/components/profiledetails";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { toast } from "react-hot-toast";
import { TicketIcon } from "@heroicons/react/24/outline";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

function ProfileButtons() {
  const { reload } = useRouter();

  const utils = trpc.useContext();

  const profile = trpc.getProfile.useQuery();

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

  const deleteProfile = trpc.deleteProfile.useMutation({
    onSuccess: () => {
      reload();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  const handleOnUpdate = () => {
    toast.loading("Loading...");
    updateProfile.mutate({
      label: profile.data?.label === "PUBLIC" ? "PRIVATE" : "PUBLIC",
    });
  };

  const handleOnDelete = () => {
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
                    onClick={handleOnDelete}
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
                    onClick={handleOnUpdate}
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
        className="inline-flex items-center justify-center space-x-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <span>Create board</span>
        <span className="flex items-center space-x-1">
          <span>(10</span> <TicketIcon className="h-5 w-5" />)
        </span>
      </button>
    </div>
  );
}

function Header() {
  const profile = trpc.getProfile.useQuery();
  return (
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
  );
}

export default function Account() {
  const profile = trpc.getProfile.useQuery();

  return (
    <>
      <main className="pb-36 pt-12">
        <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <Header />
          <div className="space-y-4">
            <h3 className="text-base font-semibold leading-6 text-brand-50">
              Boards
            </h3>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {profile.data ? (
                <div className="flex flex-col space-y-4">
                  <div className="relative">
                    <img
                      src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__6309b2fd-d55f-4753-9e85-d3dd965ee0c6.png"
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
                      <button
                        type="button"
                        className="inline-flex items-center justify-center space-x-1 rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-6 motion-safe:animate-pulse">
                    <div className="relative">
                      <div className="h-48 w-full rounded-lg bg-brand-600"></div>
                      <span className="absolute inset-0" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-5">
                        <div className="flex w-full flex-col space-y-3">
                          <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                          <div className="flex h-2.5 w-2/4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-col justify-stretch space-y-4">
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                        <div className="flex h-4 items-center space-x-4 rounded-full bg-brand-700"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
