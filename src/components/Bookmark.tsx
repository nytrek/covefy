import { useUser } from "@clerk/nextjs";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkIconOutline } from "@heroicons/react/24/outline";
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

export default function Bookmark({
  post,
  handleOnCreateBookmark,
  handleOnDeleteBookmark,
}: {
  post: Post;
  handleOnCreateBookmark: (id: number) => void;
  handleOnDeleteBookmark: (id: number) => void;
}) {
  const { user } = useUser();
  return (
    <span className="inline-flex items-center text-sm">
      <button
        type="button"
        onClick={() => {
          !!post.bookmarks.find((_post) => _post.profileId === user?.id)
            ? handleOnDeleteBookmark(post.id)
            : handleOnCreateBookmark(post.id);
        }}
        className="inline-flex space-x-2"
      >
        {post.bookmarks.find((bookmark) => bookmark.profileId === user?.id) ? (
          <BookmarkIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <BookmarkIconOutline className="h-5 w-5" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={post.bookmarks.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {post.bookmarks.length}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">bookmarks</span>
      </button>
    </span>
  );
}
