import { useUser } from "@clerk/nextjs";
import { Menu, Transition } from "@headlessui/react";
import { Prisma } from "@prisma/client";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment } from "react";

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
            name: true;
            imageUrl: true;
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

interface Props {
  item: Post;
  handleOnDeleteComment: (id: number) => void;
}

export default function Comments({ item, handleOnDeleteComment }: Props) {
  const { user } = useUser();
  return (
    <ul role="list" className="space-y-6">
      <AnimatePresence>
        {item.comments.map((comment) => (
          <motion.li
            key={comment.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative flex gap-x-4"
          >
            {comment.authorId === user?.id && (
              <Menu
                as="div"
                className="absolute inset-0 inline-block text-left"
              >
                <div>
                  <Menu.Button className="absolute inset-0"></Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => handleOnDeleteComment(comment.id)}
                            className={clsx(
                              active
                                ? "bg-brand-100 text-brand-900"
                                : "text-brand-700",
                              "block w-full px-4 py-2 text-left text-sm"
                            )}
                          >
                            Delete comment
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
            {comment.author.imageUrl ? (
              <img
                src={comment.author.imageUrl}
                alt="avatar"
                className="relative h-6 w-6 flex-none rounded-full bg-brand-700"
              />
            ) : (
              <span className="relative mt-3 h-6 w-6 flex-none rounded-full bg-brand-700"></span>
            )}
            <div className="flex-auto rounded-md">
              <div className="flex justify-between gap-x-4">
                <div className="py-0.5 text-xs leading-5 text-brand-50">
                  <span className="font-medium text-brand-50">
                    {comment.author.name}
                  </span>{" "}
                  commented
                </div>
                <time
                  dateTime={comment.createdAt.toString()}
                  className="flex-none py-0.5 text-xs leading-5 text-brand-50"
                >
                  {formatDistanceToNow(comment.createdAt, {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <p className="text-sm leading-6 text-brand-50">
                {comment.comment}
              </p>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
