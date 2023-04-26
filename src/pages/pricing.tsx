import { SignedIn } from "@clerk/nextjs";
import { RadioGroup } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const frequencies = [
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
];

const tiers = [
  {
    name: "Bronze",
    id: "tier-bronze",
    href: {
      premium:
        "https://covefy.lemonsqueezy.com/checkout/buy/a99b6ea8-aa30-4071-bf1e-e03a33fe30d1",
      enterprise:
        "https://covefy.lemonsqueezy.com/checkout/buy/b530a9b7-fe2a-4be0-a980-3089ad4fdd80",
    },
    price: { premium: "$5", enterprise: "$50" },
    features: {
      premium: ["100 credits"],
      enterprise: ["1000 credits"],
    },
    mostPopular: false,
  },
  {
    name: "Silver",
    id: "tier-silver",
    href: {
      premium:
        "https://covefy.lemonsqueezy.com/checkout/buy/1e590965-dd61-44ef-b3be-84ea115640f3",
      enterprise:
        "https://covefy.lemonsqueezy.com/checkout/buy/28151292-54af-487b-a36f-994b58c1dede",
    },
    price: { premium: "$10", enterprise: "$100" },
    features: {
      premium: ["250 credits", "Premium checkmark"],
      enterprise: ["2500 credits", "Premium checkmark"],
    },
    mostPopular: true,
  },
  {
    name: "Gold",
    id: "tier-gold",
    href: {
      premium:
        "https://covefy.lemonsqueezy.com/checkout/buy/c25da43e-8011-4841-9915-0bb67e29d677",
      enterprise:
        "https://covefy.lemonsqueezy.com/checkout/buy/171e0867-399b-4ddb-b07f-cf068d4c610c",
    },
    price: { premium: "$20", enterprise: "$200" },
    features: {
      premium: ["600 credits", "Premium checkmark"],
      enterprise: ["6000 credits", "Premium checkmark"],
    },
    mostPopular: false,
  },
];

export default function Pricing() {
  const [frequency, setFrequency] = useState(frequencies[0]);
  return (
    <SignedIn>
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
            Choose a plan and elevate your note-taking game today.
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
                <AnimatePresence mode="wait">
                  <motion.p
                    key={frequency.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        ease: "easeOut",
                        duration: 0.15,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 8,
                      transition: {
                        ease: "easeOut",
                        duration: 0.15,
                      },
                    }}
                    className="mt-6 flex items-baseline gap-x-1"
                  >
                    <span className="text-4xl font-bold tracking-tight text-brand-50">
                      {tier.price[frequency.value as "premium" | "enterprise"]}
                    </span>
                  </motion.p>
                </AnimatePresence>
                <Link
                  href={tier.href[frequency.value as "premium" | "enterprise"]}
                  aria-describedby={tier.id}
                  className={clsx(
                    tier.mostPopular
                      ? "bg-brand-500 text-brand-50 shadow-sm hover:bg-brand-300 focus-visible:outline-brand-500"
                      : "bg-brand-600 text-brand-50 hover:bg-brand-500 focus-visible:outline-white",
                    "mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  )}
                >
                  Buy plan
                </Link>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-brand-300 xl:mt-10"
                >
                  {tier.features[
                    frequency.value as "premium" | "enterprise"
                  ].map((feature) => (
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
    </SignedIn>
  );
}
