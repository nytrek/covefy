import { SignIn, useUser } from "@clerk/nextjs";
import {
  ChartBarIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { TicketIcon } from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import { trpc } from "@src/utils/trpc";
import { differenceInSeconds } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

type Post = Prisma.PostGetPayload<{
  include: {
    author: true;
    likes: true;
    comments: true;
    bookmarks: true;
  };
}>;

function Countdown() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let interval = setInterval(() => {
      const today = new Date();
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );
      const totalSeconds = differenceInSeconds(lastDayOfMonth, new Date());
      const totalMinutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setSeconds(seconds);
      setHours(hours);
      setMinutes(minutes);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="mx-auto mt-12 max-w-7xl px-4 text-center">
      <img src="/ranking.png" alt="ranking" className="mx-auto mt-2 w-24" />
      <div className="mt-8 flex flex-1 justify-center">
        <div className="flex w-full items-center justify-center space-x-6 px-2 text-2xl font-bold text-brand-50 sm:text-4xl lg:px-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={hours}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
              exit={{
                opacity: 0,
                y: -8,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
            >
              {hours}
            </motion.p>
          </AnimatePresence>
          &nbsp;H
          <AnimatePresence mode="wait">
            <motion.p
              key={minutes}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
              exit={{
                opacity: 0,
                y: -8,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
            >
              {minutes}
            </motion.p>
          </AnimatePresence>
          &nbsp;M
          <AnimatePresence mode="wait">
            <motion.p
              key={seconds}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
              exit={{
                opacity: 0,
                y: -8,
                transition: {
                  ease: "easeInOut",
                  duration: 0.2,
                },
              }}
            >
              {seconds}
            </motion.p>
          </AnimatePresence>
          &nbsp;S
        </div>
      </div>
    </div>
  );
}

function DescriptionList({ item, index }: { item: Post; index: number }) {
  return (
    <dl className="flex flex-wrap">
      <div className="flex-auto pl-6 pt-6">
        <dt className="text-sm font-semibold leading-6 text-brand-50">
          Amount
        </dt>
        <dd className="mt-1 flex items-center space-x-2 text-base font-semibold leading-6 text-brand-50">
          <span>{800 - index * 75}</span>
          <TicketIcon className="h-5 w-5" />
        </dd>
      </div>
      <div className="flex-none self-end px-6 pt-4">
        <dt className="sr-only">Status</dt>
        <dd className="rounded-md bg-brand-600 px-6 py-3 font-medium text-brand-50 ring-1 ring-inset ring-brand-400">
          Top {index + 1}
        </dd>
      </div>
      <div className="mt-6 flex w-full flex-none items-center gap-x-4 border-t border-brand-600 px-6 pt-6">
        <dt className="flex-none">
          {item.author.imageUrl ? (
            <img
              src={item.author.imageUrl}
              alt=""
              className="h-5 w-5 flex-shrink-0 rounded-full"
            />
          ) : (
            <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </dt>
        <dd className="flex items-center space-x-1 text-sm font-medium leading-6 text-brand-50">
          <span>{item.author.name}</span>
          {item.author.premium ? (
            <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
          ) : null}
        </dd>
      </div>
      <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
        <dt className="flex-none">
          <span className="sr-only">Title</span>
          <PencilSquareIcon
            className="h-6 w-5 text-brand-50"
            aria-hidden="true"
          />
        </dt>
        <dd className="text-sm leading-6 text-brand-50">
          <Link href={"/post/" + item.id} className="hover:underline">
            {item.title}
          </Link>
        </dd>
      </div>
      <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
        <dt className="flex-none">
          <span className="sr-only">Stats</span>
          <ChartBarIcon className="h-6 w-5 text-brand-50" aria-hidden="true" />
        </dt>
        <dd className="text-sm leading-6 text-brand-50">
          <p>
            {item.likes.length + item.comments.length + item.bookmarks.length}
          </p>
        </dd>
      </div>
    </dl>
  );
}

function Cta({ item }: { item: Post }) {
  return (
    <div className="mt-6 border-t border-brand-600 px-6 py-6">
      <a
        href={"/profile/" + item.author.id}
        className="text-sm font-semibold leading-6 text-brand-50"
      >
        View profile <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  );
}

export default function Ranking() {
  const { user } = useUser();
  const ranking = trpc.getRanking.useQuery();
  return (
    <>
      <div className="pb-36">
        <Countdown />
        {user ? (
          <div className="mt-8 px-2 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="grid w-full grid-cols-1 gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ranking.data?.map((item, index) => (
                  <div key={item.id} className="px-4">
                    <h2 className="sr-only">Summary</h2>
                    <div className="rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                      <DescriptionList item={item} index={index} />
                      <Cta item={item} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-16 flex w-screen justify-center">
            <SignIn />
          </div>
        )}
      </div>
    </>
  );
}
