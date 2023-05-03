import { useUser } from "@clerk/nextjs";
import { HandThumbUpIcon as HandThumbUpIconSolid } from "@heroicons/react/20/solid";
import { HandThumbUpIcon as HandThumbUpIconOutline } from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";

type Post = Prisma.PostGetPayload<{
  include: {
    _count: true;
    author: true;
    friend: true;
    likes: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
          };
        };
      };
    };
    bookmarks: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

export default function PostLike({
  post,
  handleOnCreateLike,
  handleOnDeleteLike,
}: {
  post: Post;
  handleOnCreateLike: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
  handleOnDeleteLike: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
}) {
  const { user } = useUser();
  return (
    <div className="inline-flex items-center text-sm">
      <button
        type="button"
        onClick={() => {
          post.likes.find((_post) => _post.profileId === user?.id)
            ? handleOnDeleteLike(
                post.id,
                post.authorId,
                post.author.popularity - 1
              )
            : handleOnCreateLike(
                post.id,
                post.authorId,
                post.author.popularity + 1
              );
        }}
        className="inline-flex space-x-2"
      >
        {post.likes.find((like) => like.profileId === user?.id) ? (
          <HandThumbUpIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <HandThumbUpIconOutline className="h-5 w-5" aria-hidden="true" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={post._count.likes}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {post._count.likes}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">likes</span>
      </button>
    </div>
  );
}
