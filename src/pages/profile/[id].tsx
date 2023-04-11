import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Popover } from "@headlessui/react";
import {
  BookmarkIcon,
  CheckBadgeIcon,
  HomeIcon,
  InboxStackIcon,
  RectangleStackIcon,
  SwatchIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { Bars3Icon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Account() {
  const { user } = useUser();
  const { query, route } = useRouter();
  const id = query.id as string;
  const likes = trpc.getLikes.useQuery(id);
  const profile = trpc.getProfile.useQuery(id);
  const bookmarks = trpc.getBookmarks.useQuery(id);
  const tabs = [
    { name: "My Account", href: "/account", current: route === "/account" },
    { name: "Ranking", href: "/ranking", current: route === "/ranking" },
    { name: "Friend list", href: "/friends", current: route === "/friends" },
    { name: "Billing", href: "#", current: route === "/billing" },
  ];
  const stats = [
    { name: "Total Likes", stat: likes.data ?? 0 },
    {
      name: "Total Stats",
      stat: (likes.data ?? 0) + (bookmarks.data ?? 0),
    },
    {
      name: "Total Bookmarks",
      stat: bookmarks.data ?? 0,
    },
  ];
  return (
    <>
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
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
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
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
              >
                Report account
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Send friend request
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold leading-6 text-brand-50">
              Your progress
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
