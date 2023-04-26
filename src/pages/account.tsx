import { useUser } from "@clerk/nextjs";
import { Menu, RadioGroup, Transition } from "@headlessui/react";
import { CheckBadgeIcon, PencilSquareIcon } from "@heroicons/react/20/solid";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload } from "upload-js";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

const upload = Upload({
  apiKey: process.env.NEXT_PUBLIC_UPLOAD_APIKEY as string,
});

function Avatar() {
  const profile = trpc.getProfile.useQuery();
  return (
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
  );
}

function UserInfo() {
  const profile = trpc.getProfile.useQuery();
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

function UserButtons() {
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
  return (
    <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
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
                    onClick={() => deleteProfile.mutate()}
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
                    onClick={() =>
                      updateProfile.mutate({
                        label:
                          profile.data?.label === "PUBLIC"
                            ? "PRIVATE"
                            : "PUBLIC",
                      })
                    }
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
      <Link
        href="/feedback"
        className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Send feedback
      </Link>
    </div>
  );
}

function Header() {
  return (
    <>
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-center space-x-5">
          <Avatar />
          <UserInfo />
        </div>
        <UserButtons />
      </div>
    </>
  );
}

function Stats() {
  const likes = trpc.getLikes.useQuery();
  const comments = trpc.getComments.useQuery();
  const bookmarks = trpc.getBookmarks.useQuery();
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
        Your stats
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

function Dropdown() {
  const utils = trpc.useContext();
  const profile = trpc.getProfile.useQuery();
  const banners = trpc.getProfileBanners.useQuery();
  const updateBanner = trpc.updateProfileBanner.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getProfile.invalidate();
      toast.success("Banner updated!");
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });
  const handleOnUpdateBanner = (banner: string) => {
    toast.loading("Loading...");
    updateBanner.mutate({ banner });
  };
  return (
    <Menu
      as="div"
      className="absolute right-2 top-2 z-10 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
    >
      <div>
        <Menu.Button className="flex items-center rounded-full text-brand-400 hover:text-brand-200">
          <PencilSquareIcon className="h-5 w-5 text-brand-600" />
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
          <div className="p-4">
            <Menu.Item>
              <RadioGroup
                value={profile.data?.banner}
                onChange={(banner: string) => handleOnUpdateBanner(banner)}
              >
                <RadioGroup.Label className="sr-only">Banners</RadioGroup.Label>
                <div className="space-y-4">
                  <RadioGroup.Option
                    value={null}
                    className={({ checked, active }) =>
                      clsx(
                        checked ? "border-transparent" : "border-brand-300",
                        active ? "border-brand-600 ring-2 ring-brand-600" : "",
                        "relative block cursor-pointer rounded-lg border bg-brand-50 p-1"
                      )
                    }
                  >
                    {({ active, checked }) => (
                      <>
                        <span className="flex items-center">
                          <span className="flex flex-col text-sm">
                            <img
                              src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__6309b2fd-d55f-4753-9e85-d3dd965ee0c6.png"
                              alt="banner"
                              className="rounded-md"
                            />
                          </span>
                        </span>
                        <span
                          className={clsx(
                            active ? "border" : "border-2",
                            checked ? "border-brand-600" : "border-transparent",
                            "pointer-events-none absolute -inset-px rounded-lg"
                          )}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </RadioGroup.Option>
                  {banners.data?.map((banner) => (
                    <RadioGroup.Option
                      key={banner.id}
                      value={banner.imageUrl}
                      className={({ checked, active }) =>
                        clsx(
                          checked ? "border-transparent" : "border-brand-300",
                          active
                            ? "border-brand-600 ring-2 ring-brand-600"
                            : "",
                          "relative block cursor-pointer rounded-lg border bg-brand-50 p-1"
                        )
                      }
                    >
                      {({ active, checked }) => (
                        <>
                          <span className="flex items-center">
                            <span className="flex flex-col text-sm">
                              <img
                                src={banner.imageUrl}
                                alt="banner"
                                className="rounded-md"
                              />
                            </span>
                          </span>
                          <span
                            className={clsx(
                              active ? "border" : "border-2",
                              checked
                                ? "border-brand-600"
                                : "border-transparent",
                              "pointer-events-none absolute -inset-px rounded-lg"
                            )}
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export default function Account() {
  const { user } = useUser();
  const profile = trpc.getProfile.useQuery();
  const [isAuth, setIsAuth] = useState(false);
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
  return (
    <>
      {isAuth && profile.data ? (
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
              <span className="absolute inset-0" />
              <Dropdown />
            </div>
            <Header />
            <Stats />
          </div>
        </main>
      ) : null}
    </>
  );
}
