import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { Prisma } from "@prisma/client";
import clsx from "clsx";
import { Fragment } from "react";

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
  post: Post;
  handleOnEditPost: (post: Post) => void;
  handleOnDeletePost: (post: Post) => void;
  handleOnUpdatePost: (post: Post, pinned: boolean) => void;
}

export default function PostDropdown({
  post,
  handleOnEditPost,
  handleOnDeletePost,
  handleOnUpdatePost,
}: Props) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full text-brand-400 hover:text-brand-200">
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
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
            {/**
             * Render edit button for the post
             */}
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => handleOnEditPost(post)}
                  className={clsx(
                    active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                    "w-full px-4 py-2 text-left text-sm"
                  )}
                >
                  Edit
                </button>
              )}
            </Menu.Item>

            {/**
             * Render delete button for the post
             */}
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => handleOnDeletePost(post)}
                  className={clsx(
                    active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                    "w-full px-4 py-2 text-left text-sm"
                  )}
                >
                  Delete
                </button>
              )}
            </Menu.Item>

            {/**
             * Render pin button for the post
             */}
            {!post.pinned && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => handleOnUpdatePost(post, true)}
                    className={clsx(
                      active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                      "w-full px-4 py-2 text-left text-sm"
                    )}
                  >
                    Pin post
                  </button>
                )}
              </Menu.Item>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
