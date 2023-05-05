import { useUser } from "@clerk/nextjs";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction } from "react";

interface Props {
  header: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  handleOnClick: () => void;
}

export default function Header({
  header,
  search,
  setSearch,
  handleOnClick,
}: Props) {
  const { user } = useUser();
  const { route } = useRouter();
  return (
    <div className="space-y-12">
      <div className="mx-auto mt-12 max-w-xl space-y-10 px-4 text-center">
        <p className="text-3xl font-semibold text-brand-50">{header}</p>
        <div className="flex flex-1 justify-center">
          <div className="w-full lg:px-6">
            <label htmlFor="search" className="sr-only">
              Search posts
            </label>
            <div className="relative flex items-center text-brand-50">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                className={clsx(
                  !user || route === "/friends" ? "pl-10" : "px-10",
                  "block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 py-3 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
                )}
                placeholder="Search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {user && route !== "/friends" ? (
                <button type="button" onClick={handleOnClick}>
                  <PencilSquareIcon className="absolute right-3 top-3 h-6 w-6" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {route !== "/friends" && (
        <div className="flex items-center overflow-x-auto px-1 text-white sm:px-3 md:justify-center">
          <Link href="/">
            <div className="w-44 text-center">Artificial Intelligence</div>
          </Link>
          <Link href="/">
            <div className="w-40 text-center">Web Development</div>
          </Link>
          <Link href="/">
            <div className="w-20 text-center">Cloud</div>
          </Link>
          <Link href="/">
            <div className="w-16 text-center">IOT</div>
          </Link>
          <Link href="/">
            <div className="w-32 text-center">UI/UX Design</div>
          </Link>
          <Link href="/">
            <div className="w-24 text-center">Software</div>
          </Link>
        </div>
      )}
    </div>
  );
}
