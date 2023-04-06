import {
  BookmarkIcon,
  HomeIcon,
  UserGroupIcon,
  Cog8ToothIcon,
  UserCircleIcon,
  SwatchIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Settings() {
  const { push } = useRouter();
  return (
    <>
      <form className="mx-auto max-w-2xl px-6 pb-36 pt-12">
        <div className="mx-auto max-w-xl px-4 text-center">
          <SwatchIcon className="mx-auto h-8 w-8 text-brand-50" />
          <p className="mt-2 text-3xl font-semibold text-brand-50">
            Customize your profile settings to your own preferences.
          </p>
        </div>
        <div className="space-y-12">
          <div className="border-b border-brand-50 pb-12">
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="col-span-full">
                <label
                  htmlFor="about"
                  className="block text-sm font-medium leading-6 text-brand-50"
                >
                  About
                </label>
                <div className="mt-2">
                  <textarea
                    id="about"
                    name="about"
                    rows={3}
                    className="block w-full rounded-md border-0 text-brand-900 focus:ring-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
                    defaultValue={""}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-brand-50">
                  Write a few sentences about yourself.
                </p>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="photo"
                  className="block text-sm font-medium leading-6 text-brand-50"
                >
                  Photo
                </label>
                <div className="mt-2 flex items-center gap-x-3">
                  <UserCircleIcon
                    className="h-12 w-12 text-brand-50"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="rounded-md bg-brand-50 px-2.5 py-1.5 text-sm font-semibold text-brand-900 focus:ring-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-brand-50 pb-12">
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-full">
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium leading-6 text-brand-50"
                >
                  Username
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="first-name"
                    id="first-name"
                    autoComplete="given-name"
                    className="block w-full rounded-md border-0 py-1.5 text-brand-900 focus:ring-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
                  />
                </div>
              </div>

              <div className="sm:col-span-full">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-brand-50"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-md border-0 py-1.5 text-brand-900 focus:ring-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="button"
            onClick={() => push("/")}
            className="text-sm font-semibold leading-6 text-brand-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#464649] px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
          >
            Save
          </button>
        </div>
      </form>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
        <div className="pointer-events-auto flex items-center justify-between border border-brand-600 bg-brand-900 bg-opacity-90 p-6 backdrop-blur-md sm:gap-x-16 sm:rounded-xl">
          <Link href="/" className="border border-transparent p-2">
            <HomeIcon className="h-8 w-8 rounded-full text-brand-50/40" />
          </Link>
          <Link href="/community" className="border border-transparent p-2">
            <UserGroupIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
          <Link href="/bookmark" className="border border-transparent p-2">
            <BookmarkIcon className="h-8 w-8 text-brand-50/40" />
          </Link>
          <Link
            href="/settings"
            className="rounded-full border border-brand-base bg-brand-800 p-2"
          >
            <Cog8ToothIcon className="h-8 w-8 text-brand-50/70" />
          </Link>
        </div>
      </div>
    </>
  );
}
