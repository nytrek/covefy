import { CheckBadgeIcon, PencilSquareIcon } from "@heroicons/react/20/solid";
import Footer from "@src/components/footer";
import Navbar from "@src/components/navbar";
import { trpc } from "@src/utils/trpc";
import clsx from "clsx";

function Header() {
  const profile = trpc.getProfile.useQuery();
  return (
    <>
      {profile.data ? (
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <div className="relative">
                {profile.data?.imageUrl ? (
                  <img
                    className="h-16 w-16 rounded-full"
                    src={profile.data?.imageUrl}
                    alt=""
                  />
                ) : (
                  <span className="block h-16 w-16 rounded-full bg-brand-700"></span>
                )}
                <span
                  className="absolute inset-0 rounded-full shadow-inner"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-brand-50">
                  {profile.data.name}
                </h1>
                {profile.data.premium ? (
                  <CheckBadgeIcon className="mt-1 h-6 w-6 text-brand-50" />
                ) : null}
              </div>
              <p className="text-sm font-medium text-brand-500">
                @{profile.data.username}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
            >
              Disable account
            </button>
            <button
              type="button"
              className={clsx(
                !profile.data.claim
                  ? "cursor-not-allowed bg-brand-800 hover:bg-brand-700"
                  : "bg-brand-600 hover:bg-brand-500",
                "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              )}
              disabled={!profile.data.claim}
            >
              Claim credits
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Progress() {
  const likes = trpc.getLikes.useQuery();
  const comments = trpc.getComments.useQuery();
  const bookmarks = trpc.getBookmarks.useQuery();
  const stats = [
    {
      name: "Total Likes",
      stat:
        likes.data?.reduce((prev, curr) => prev + curr._count.likes, 0) ?? 0,
    },
    {
      name: "Total Comments",
      stat:
        comments.data?.reduce((prev, curr) => prev + curr._count.comments, 0) ??
        0,
    },
    {
      name: "Total Bookmarks",
      stat:
        bookmarks.data?.reduce(
          (prev, curr) => prev + curr._count.bookmarks,
          0
        ) ?? 0,
    },
  ];
  return (
    <div>
      <h3 className="text-base font-semibold leading-6 text-brand-50">
        Your progress
      </h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-lg border border-brand-600 bg-brand-800 px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-brand-500">
              {item.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-brand-50">
              {item.stat}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Account() {
  const profile = trpc.getProfile.useQuery();
  return (
    <>
      <Navbar />
      {profile.data ? (
        <main className="pb-36 pt-12">
          <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="relative">
              <img
                src="/banners/Ktra99_cozy_minimalistic_3D_fullstack_developer_workspace_that__6309b2fd-d55f-4753-9e85-d3dd965ee0c6.png"
                alt="banner"
                className="rounded-lg object-cover"
              />
              <span className="absolute inset-0" />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-brand-50 bg-opacity-75 p-1.5 backdrop-blur-sm transition duration-300 hover:bg-opacity-100"
              >
                <PencilSquareIcon className="h-5 w-5 text-brand-600" />
              </button>
            </div>
            <Header />
            <Progress />
          </div>
        </main>
      ) : null}
      <Footer />
    </>
  );
}
