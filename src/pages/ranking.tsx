import { CheckBadgeIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import { TicketIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import { differenceInSeconds } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Ranking() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const ranking = trpc.getRanking.useQuery();
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
    <>
      <div className="pb-36">
        <Navbar />
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
        <div className="mt-8 px-2 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex w-full flex-col justify-center space-x-0 space-y-8 lg:flex-row lg:space-y-0">
              {ranking.data?.map((profile, index) => (
                <div key={profile.id} className="px-4">
                  <h2 className="sr-only">Summary</h2>
                  <div className="rounded-2xl border border-brand-600 bg-brand-800 p-5 text-sm leading-6">
                    <dl className="flex flex-wrap">
                      <div className="flex-auto pl-6 pt-6">
                        <dt className="text-sm font-semibold leading-6 text-brand-50">
                          Amount
                        </dt>
                        <dd className="mt-1 flex items-center space-x-2 text-base font-semibold leading-6 text-brand-50">
                          <span>{1000 - index * 100}</span>
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
                          {profile.imageUrl ? (
                            <img
                              src={profile.imageUrl}
                              alt=""
                              className="h-5 w-5 flex-shrink-0 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          )}
                        </dt>
                        <dd className="flex items-center space-x-1 text-sm font-medium leading-6 text-brand-50">
                          <span>{profile.name}</span>
                          {profile.premium ? (
                            <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                          ) : null}
                        </dd>
                      </div>
                      <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
                        <dt className="flex-none">
                          <span className="sr-only">Bookmarks</span>
                          <BookmarkIcon
                            className="h-6 w-5 text-brand-50"
                            aria-hidden="true"
                          />
                        </dt>
                        <dd className="text-sm leading-6 text-brand-50">
                          <p>{profile.bookmarks?.length} Bookmarks</p>
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-6 border-t border-brand-600 px-6 py-6">
                      <a
                        href={"/profile/" + profile.id}
                        className="text-sm font-semibold leading-6 text-brand-50"
                      >
                        View profile <span aria-hidden="true">&rarr;</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
