import { useUser } from "@clerk/nextjs";
import { ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconSolid } from "@heroicons/react/20/solid";
import { ChatBubbleOvalLeftIcon as ChatBubbleOvalLeftIconOutline } from "@heroicons/react/24/outline";
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

export default function PostComment({ post }: { post: Post }) {
  const { user } = useUser();
  return (
    <span className="inline-flex items-center text-sm">
      <button type="button" className="inline-flex space-x-2">
        {post.comments.find((comment) => comment.authorId === user?.id) ? (
          <ChatBubbleOvalLeftIconSolid className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ChatBubbleOvalLeftIconOutline
            className="h-5 w-5"
            aria-hidden="true"
          />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={post._count.comments}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="font-medium"
          >
            {post._count.comments}
          </motion.span>
        </AnimatePresence>
        <span className="sr-only">comments</span>
      </button>
    </span>
  );
}
