import { useUser } from "@clerk/nextjs";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Prisma } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";

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

export default function BookmarkCheck({ item }: { item: Post }) {
  const { user } = useUser();
  return (
    <div>
      <AnimatePresence mode="wait">
        {item.bookmarks.find((bookmark) => bookmark.profileId === user?.id) ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex text-sm"
          >
            <span className="inline-flex items-center text-sm">
              <button type="button" className="inline-flex space-x-2">
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Bookmarked</span>
              </button>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
