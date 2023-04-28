import { SignedIn } from "@clerk/nextjs";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Prisma } from "@prisma/client";
import { trpc } from "@src/utils/trpc";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

type Post = Prisma.PostGetPayload<{
  include: {
    likes: true;
    bookmarks: true;
    author: true;
    friend: true;
    comments: {
      include: {
        author: true;
      };
    };
  };
}>;

interface Props {
  handleOnUpdatePost: (item: Post, pinned: boolean) => void;
}

export default function PinnedPosts({ handleOnUpdatePost }: Props) {
  /**
   * trpc queries
   */
  const pinned = trpc.getPinnedPosts.useQuery();
  return (
    <SignedIn>
      <AnimatePresence mode="wait">
        {!!pinned.data ? (
          <>
            <div className="mb-8">
              <ul
                role="list"
                className="flex items-center space-x-6 overflow-x-auto"
              >
                <AnimatePresence>
                  {!!!pinned.data.length ? (
                    <motion.div
                      key={0}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative col-span-1 flex rounded-md shadow-sm"
                    >
                      <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                        # ID
                      </div>
                      <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 pr-2">
                        <div className="flex-1 truncate px-4 py-2 text-sm">
                          <h4 className="font-medium text-brand-50">
                            Pinned notes will appear here
                          </h4>
                          <p className="w-36 truncate text-brand-500">
                            Your note description
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {pinned.data.map((item) => (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative col-span-1 flex rounded-md shadow-sm"
                        >
                          <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                            {item.id}
                          </div>
                          <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 pr-2">
                            <div className="flex-1 truncate px-4 py-2 text-sm">
                              <Link
                                href={"/post/" + item.id}
                                className="font-medium text-brand-50"
                              >
                                {item.title}
                              </Link>
                              <p className="w-36 truncate text-brand-500">
                                {item.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOnUpdatePost(item, false)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-500"
                            >
                              <span className="sr-only">Unpin</span>
                              <XMarkIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </ul>
            </div>
          </>
        ) : (
          <div className="mb-8">
            <div className="flex items-center space-x-6 overflow-x-auto">
              <motion.div
                key={0}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="relative col-span-1 flex rounded-md shadow-sm"
              >
                <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                  <div className="flex h-2 w-2/5 items-center space-x-4 rounded-full bg-brand-500 motion-safe:animate-pulse"></div>
                </div>
                <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 py-3 pr-2">
                  <div className="flex-1 space-y-2 truncate px-4 py-2 text-sm">
                    <h4 className="font-medium text-brand-50">
                      <div className="flex h-2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </h4>
                    <p className="w-36 truncate text-brand-500">
                      <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                key={0}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="relative col-span-1 flex rounded-md shadow-sm"
              >
                <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                  <div className="flex h-2 w-2/5 items-center space-x-4 rounded-full bg-brand-500 motion-safe:animate-pulse"></div>
                </div>
                <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 py-3 pr-2">
                  <div className="flex-1 space-y-2 truncate px-4 py-2 text-sm">
                    <h4 className="font-medium text-brand-50">
                      <div className="flex h-2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </h4>
                    <p className="w-36 truncate text-brand-500">
                      <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                key={0}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="relative col-span-1 flex rounded-md shadow-sm"
              >
                <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                  <div className="flex h-2 w-2/5 items-center space-x-4 rounded-full bg-brand-500 motion-safe:animate-pulse"></div>
                </div>
                <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 py-3 pr-2">
                  <div className="flex-1 space-y-2 truncate px-4 py-2 text-sm">
                    <h4 className="font-medium text-brand-50">
                      <div className="flex h-2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </h4>
                    <p className="w-36 truncate text-brand-500">
                      <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                key={0}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="relative col-span-1 flex rounded-md shadow-sm"
              >
                <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                  <div className="flex h-2 w-2/5 items-center space-x-4 rounded-full bg-brand-500 motion-safe:animate-pulse"></div>
                </div>
                <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 py-3 pr-2">
                  <div className="flex-1 space-y-2 truncate px-4 py-2 text-sm">
                    <h4 className="font-medium text-brand-50">
                      <div className="flex h-2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </h4>
                    <p className="w-36 truncate text-brand-500">
                      <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </SignedIn>
  );
}
