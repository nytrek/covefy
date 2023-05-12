import { SignedIn } from "@clerk/nextjs";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { RouterOutputs } from "@src/server/routers/_app";
import { trpc } from "@src/utils/trpc";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

type Post = RouterOutputs["getPublicPosts"][number];

interface Props {
  handleOnUpdatePost: (post: Post, pinned: boolean) => void;
}

function Skeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-6 overflow-x-auto">
        <motion.div
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
              <div className="flex h-2 w-36 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
              <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
            </div>
          </div>
        </motion.div>
        <motion.div
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
              <div className="flex h-2 w-36 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
              <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
            </div>
          </div>
        </motion.div>
        <motion.div
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
              <div className="flex h-2 w-36 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
              <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
            </div>
          </div>
        </motion.div>
        <motion.div
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
              <div className="flex h-2 w-36 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
              <div className="flex h-2 w-1/2 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PinnedPosts({ handleOnUpdatePost }: Props) {
  const pinned = trpc.getPinnedPosts.useQuery();
  return (
    <SignedIn>
      <AnimatePresence mode="wait">
        {pinned.data ? (
          <>
            <div className="mb-8">
              <ul
                role="list"
                className="flex items-center space-x-6 overflow-x-auto"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {!pinned.data.length ? (
                    <motion.div
                      key={Number(!pinned.data.length)}
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
                            Pinned posts will appear here
                          </h4>
                          <p className="w-36 truncate text-brand-500">
                            Your post description
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {pinned.data.map((post) => (
                        <motion.li
                          key={post.id}
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative col-span-1 flex rounded-md shadow-sm"
                        >
                          <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-brand-600 text-sm font-medium text-brand-50">
                            {post.id}
                          </div>
                          <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-brand-800 pr-2">
                            <div className="w-48 flex-1 truncate px-4 py-2 text-sm text-brand-50">
                              <Link
                                href={"/post/" + post.id}
                                className="font-medium"
                              >
                                {post.title}
                              </Link>
                              <p className="w-36 truncate text-brand-500">
                                {post.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOnUpdatePost(post, false)}
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
                    </AnimatePresence>
                  )}
                </AnimatePresence>
              </ul>
            </div>
          </>
        ) : (
          <Skeleton />
        )}
      </AnimatePresence>
    </SignedIn>
  );
}
