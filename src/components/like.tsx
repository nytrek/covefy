import { useUser } from "@clerk/nextjs";
import { HandThumbUpIcon as HandThumbUpIconSolid } from "@heroicons/react/20/solid";
import { HandThumbUpIcon as HandThumbUpIconOutline } from "@heroicons/react/24/outline";
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

export default function Like({
  item,
  handleOnCreateLike,
  handleOnDeleteLike,
}: {
  item: Post;
  handleOnCreateLike: (id: number) => void;
  handleOnDeleteLike: (id: number) => void;
}) {
  const { user } = useUser();
  return (
    <div className="inline-flex items-center text-sm">
      <button
        type="button"
        onClick={() => {
          !!item.likes.find((post) => post.profileId === user?.id)
            ? handleOnDeleteLike(item.id)
            : handleOnCreateLike(item.id);
        }}
        className="inline-flex space-x-2"
      >
        {item.likes.find((like) => like.profileId === user?.id) ? (
          <HandThumbUpIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <HandThumbUpIconOutline className="h-5 w-5" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={item.likes.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {item.likes.length}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">likes</span>
      </button>
    </div>
  );
}