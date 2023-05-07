import { FireIcon } from "@heroicons/react/20/solid";
import { TicketIcon } from "@heroicons/react/24/outline";
import { trpc } from "@src/utils/trpc";
import Link from "next/link";

export default function Rank() {
  const profiles = trpc.getProfiles.useQuery();
  return (
    <div className="mt-8 pb-36">
      <div className="mx-auto max-w-7xl p-6">
        <h2 className="mx-auto text-3xl font-bold tracking-tight text-brand-50 sm:text-4xl">
          Apprentice.
        </h2>
        <p className="mx-auto mt-6 text-lg leading-8 text-brand-300">
          Reserved for individuals who are just starting out and learning the
          ropes of the craft, but show potential for growth and improvement with
          guidance and practice.
        </p>
        <div>
          <div className="mt-6" aria-hidden="true">
            <div className="overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-brand-600"
                style={{ width: "37.5%" }}
              />
            </div>
          </div>
        </div>
        <div className="my-10 flex items-center gap-x-6">
          <button
            type="button"
            className="flex items-center space-x-2 rounded-md bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-50"
          >
            <span>Level up</span>
            <span className="flex items-center space-x-1">
              <span>(250</span>
              <TicketIcon className="h-5 w-5" />)
            </span>
          </button>
          <Link
            href="/feedback"
            className="text-sm font-semibold leading-6 text-brand-50"
          >
            Send feedback <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul role="list" className="divide-y divide-brand-800">
          {profiles.data?.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-col gap-y-6 py-5 sm:flex-row sm:justify-between sm:gap-x-6"
            >
              <div className="flex gap-x-4">
                <img
                  className="h-12 w-12 flex-none rounded-full bg-brand-800"
                  src={profile.imageUrl}
                  alt="avatar"
                />
                <div className="min-w-0 flex-auto">
                  <p className="text-xl font-semibold leading-6 text-white">
                    {profile.name}
                  </p>
                  <p className="mt-2 truncate text-lg leading-5 text-brand-400">
                    @{profile.username}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start space-y-4 sm:items-end sm:space-y-1.5">
                <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-0.5 text-sm font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                  Apprentice
                </span>
                <p className="flex items-center space-x-1 leading-6 text-brand-50">
                  <FireIcon className="h-4 w-4" />
                  <span>{profile.popularity}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
