import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Popover, RadioGroup } from "@headlessui/react";
import {
  BookmarkIcon,
  CheckIcon,
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
import { useState } from "react";

const frequencies = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];

const tiers = [
  {
    name: "Basic",
    id: "tier-basic",
    href: "#",
    price: { monthly: "$5", annually: "$50" },
    features: ["250 credits/month"],
    mostPopular: false,
  },
  {
    name: "Premium",
    id: "Premium",
    href: "#",
    price: { monthly: "$10", annually: "$100" },
    features: ["500 credits/month", "Premium checkmark"],
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "#",
    price: { monthly: "$40", annually: "$440" },
    features: ["2000 credits/month", "Premium checkmark"],
    mostPopular: false,
  },
];

export default function Pricing() {
  const { user } = useUser();
  const { route } = useRouter();
  const profile = trpc.getProfile.useQuery();
  const tabs = [
    { name: "My Account", href: "/account", current: route === "/account" },
    { name: "Friend list", href: "/friends", current: route === "/friends" },
    { name: "Billing", href: "/billing", current: route === "/billing" },
    { name: "Support", href: "/support", current: route === "/support" },
  ];
  const [frequency, setFrequency] = useState(frequencies[0]);
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
                    href="/plans"
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
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-brand-500">
              Pricing
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-brand-50 sm:text-5xl">
              Go Premium
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-brand-300">
            Choose a plan and elevate your content game today.
          </p>
          <div className="mt-16 flex justify-center">
            <RadioGroup
              value={frequency}
              onChange={setFrequency}
              className="grid grid-cols-2 gap-x-1 rounded-full bg-brand-800 p-1 text-center text-xs font-semibold leading-5 text-brand-50"
            >
              <RadioGroup.Label className="sr-only">
                Payment frequency
              </RadioGroup.Label>
              {frequencies.map((option) => (
                <RadioGroup.Option
                  key={option.value}
                  value={option}
                  className={({ checked }) =>
                    clsx(
                      checked ? "bg-brand-500" : "",
                      "cursor-pointer rounded-full px-2.5 py-1"
                    )
                  }
                >
                  <span>{option.label}</span>
                </RadioGroup.Option>
              ))}
            </RadioGroup>
          </div>
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={clsx(
                  tier.mostPopular
                    ? "bg-brand-800 ring-2 ring-brand-500"
                    : "ring-1 ring-brand-600",
                  "rounded-3xl p-8 xl:p-10"
                )}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className="text-lg font-semibold leading-8 text-brand-50"
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold leading-5 text-brand-50">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-brand-50">
                    {tier.price[frequency.value as "monthly" | "annually"]}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-brand-300">
                    {frequency.priceSuffix}
                  </span>
                </p>
                <a
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={clsx(
                    tier.mostPopular
                      ? "bg-brand-500 text-brand-50 shadow-sm hover:bg-brand-300 focus-visible:outline-brand-500"
                      : "bg-brand-600 text-brand-50 hover:bg-brand-500 focus-visible:outline-white",
                    "mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  )}
                >
                  Buy plan
                </a>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-brand-300 xl:mt-10"
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className="h-6 w-5 flex-none text-brand-50"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
