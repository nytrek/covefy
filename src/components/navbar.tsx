import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Popover } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Navbar() {
  const { user } = useUser();
  const { route } = useRouter();
  const profile = trpc.getProfile.useQuery();
  const [openPanel, setOpenPanel] = useState(false);
  const tabs = [
    { name: "My Account", href: "/account", current: route === "/account" },
    { name: "Friend list", href: "/friends", current: route === "/friends" },
    {
      name: "Marketplace",
      href: "/marketplace",
      current: route === "/marketplace",
    },
    { name: "Ranking", href: "/ranking", current: route === "/ranking" },
    { name: "Support", href: "/support", current: route === "/support" },
  ];
  return (
    <Popover as="header">
      {({ open }) => (
        <>
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="relative flex justify-between">
              <div className="flex space-x-10">
                <Link href="/" className="flex flex-shrink-0 items-center">
                  <img
                    className="mx-auto block h-10 w-10"
                    src="/logo.png"
                    alt="logo"
                  />
                </Link>
                <div>
                  {user ? (
                    <div className="hidden lg:block">
                      <nav className="flex space-x-4" aria-label="Tabs">
                        {tabs.map((tab) => (
                          <Link
                            key={tab.name}
                            href={tab.href}
                            className="relative rounded-md px-3 py-2 text-sm font-medium text-brand-50"
                            aria-current={tab.current ? "page" : undefined}
                          >
                            {tab.current ? (
                              <motion.div
                                layoutId="current"
                                className="absolute inset-0 rounded-md bg-brand-700"
                              ></motion.div>
                            ) : null}
                            <span className="relative">{tab.name}</span>
                          </Link>
                        ))}
                      </nav>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
                {/* Mobile menu button */}
                <Popover.Button
                  onClick={() => setOpenPanel(!openPanel)}
                  className="-mx-2 inline-flex items-center justify-center rounded-md p-2 text-brand-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-50"
                >
                  <span className="sr-only">Open menu</span>
                  {user ? (
                    <>
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
                    </>
                  ) : (
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-full bg-brand-600"
                      >
                        <UserCircleIcon className="h-8 w-8 text-brand-50" />
                      </button>
                    </SignInButton>
                  )}
                </Popover.Button>
              </div>
              <div className="hidden space-x-5 lg:flex lg:items-center lg:justify-end xl:col-span-4">
                {user ? (
                  <>
                    <Link
                      href="/pricing"
                      className="text-sm font-medium text-brand-50 hover:underline"
                    >
                      Go Premium
                    </Link>
                    <Link
                      href="/pricing"
                      className="flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <p>{profile.data?.credits}</p>
                      <TicketIcon className="h-6 w-6" aria-hidden="true" />
                    </Link>
                  </>
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

          {user && openPanel && (
            <Popover.Panel
              static
              as="nav"
              className="lg:hidden"
              aria-label="Global"
            >
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
                    <Link
                      href="/pricing"
                      className="ml-auto flex flex-shrink-0 items-center space-x-2 rounded-full p-1 text-brand-50"
                    >
                      <span className="sr-only">View notifications</span>
                      <p>{profile.data?.credits}</p>
                      <TicketIcon className="h-6 w-6" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
                {user ? (
                  <div className="mx-auto mt-3 space-y-1 px-2 sm:px-4">
                    {tabs.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="relative block rounded-md px-3 py-2 text-base font-medium text-brand-50"
                      >
                        {item.current ? (
                          <motion.div
                            layoutId="current"
                            className="absolute inset-0 bg-brand-800"
                          ></motion.div>
                        ) : null}
                        <span className="relative">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {user ? (
                <div className="mx-auto mt-6 px-4 sm:px-6">
                  <Link
                    href="/pricing"
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-base font-medium text-brand-50 shadow-sm hover:bg-brand-700"
                  >
                    Go premium
                  </Link>
                </div>
              ) : null}
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
}
