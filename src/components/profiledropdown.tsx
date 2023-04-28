import { Menu, Transition } from "@headlessui/react";
import { Prisma } from "@prisma/client";
import clsx from "clsx";
import Link from "next/link";
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

export default function ProfileDropdown({ post }: { post: Post }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center rounded-full bg-brand-100 text-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-brand-100">
          {post.author?.imageUrl ? (
            <img
              className="h-10 w-10 rounded-full"
              src={post.author?.imageUrl}
              alt=""
            />
          ) : (
            <span className="block h-10 w-10 rounded-full bg-brand-700"></span>
          )}
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
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-brand-50 shadow-lg ring-1 ring-brand-900 ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={"/profile/" + post.authorId}
                  className={clsx(
                    active ? "bg-brand-100 text-brand-900" : "text-brand-700",
                    "block px-4 py-2 text-sm"
                  )}
                >
                  View profile
                </Link>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
