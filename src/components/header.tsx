import { useUser } from "@clerk/nextjs";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import { Prisma, Profile } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

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

export default function Header({
  header,
  search,
  setOpen,
  setPost,
  setSearch,
  setFriend,
}: {
  header: string;
  search: string;
  setPost: Dispatch<SetStateAction<Post | null>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSearch: Dispatch<SetStateAction<string>>;
  setFriend?: Dispatch<SetStateAction<Profile | null>>;
}) {
  const { user } = useUser();
  return (
    <div className="mx-auto mt-12 max-w-xl px-4 text-center">
      <p className="mt-2 text-3xl font-semibold text-brand-50">{header}</p>
      <div className="mt-8 flex flex-1 justify-center">
        <div className="w-full px-2 lg:px-6">
          <label htmlFor="search" className="sr-only">
            Search projects
          </label>
          <div className="relative flex items-center text-brand-50">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 px-10 py-3 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
              placeholder="Search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(true);
                  setPost(null);
                  setFriend ? setFriend(null) : null;
                }}
              >
                <PencilSquareIcon className="absolute right-3 top-3 h-6 w-6" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
