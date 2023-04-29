import { SignedIn, useUser } from "@clerk/nextjs";
import { CalendarDaysIcon, ChartBarIcon } from "@heroicons/react/20/solid";
import Header from "@src/components/header";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "../utils/trpc";

export default function Community() {
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * useState that might be replaced with a state management library
   */
  const [search, setSearch] = useState("");

  /**
   * trpc queries
   */
  const profiles = trpc.getCommunityPosts.useQuery();
  return (
    <>
      <div className="pb-36">
        <Header
          header="Explore notes from the community."
          search={search}
          setSearch={setSearch}
          handleOnClick={() => null}
        />
        <SignedIn>
          <div className="mt-8 px-2 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-8">
              {profiles.data
                ?.filter((profile) =>
                  profile.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((profile) => (
                  <div key={profile.id} className="w-full">
                    <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-brand-50">
                            {profile.name}
                          </h2>
                          <p className="text-brand-500">Latest posts</p>
                        </div>
                        <Link
                          href={"/profile/" + profile.id}
                          className="hidden text-sm font-semibold text-brand-50 sm:block"
                        >
                          View profile
                          <span aria-hidden="true"> &rarr;</span>
                        </Link>
                      </div>

                      <div className="relative mt-8">
                        <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                          <ul
                            role="list"
                            className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                          >
                            {profile.posts.map((post) => (
                              <li
                                key={post.id}
                                className="inline-flex w-64 flex-col rounded-lg border border-brand-600 bg-brand-800 lg:w-auto"
                              >
                                <div className="lg:col-start-3 lg:row-end-1">
                                  <h2 className="sr-only">Summary</h2>
                                  <div className="rounded-lg shadow-sm ring-1 ring-gray-900/5">
                                    <dl className="flex flex-wrap space-y-4">
                                      <div className="flex-auto pl-6 pt-6">
                                        <dd className="mt-1 text-base font-semibold leading-6 text-brand-50">
                                          {post.title}
                                        </dd>
                                      </div>
                                      <div className="flex w-full flex-none gap-x-4 px-6">
                                        <dt className="flex-none">
                                          <span className="sr-only">Stats</span>
                                          <ChartBarIcon
                                            className="h-6 w-5 text-brand-50"
                                            aria-hidden="true"
                                          />
                                        </dt>
                                        <dd className="text-sm font-medium leading-6 text-brand-50">
                                          {post.likes.length +
                                            post.comments.length +
                                            post.bookmarks.length}
                                        </dd>
                                      </div>
                                      <div className="flex w-full flex-none gap-x-4 px-6">
                                        <dt className="flex-none">
                                          <span className="sr-only">
                                            Created
                                          </span>
                                          <CalendarDaysIcon
                                            className="h-6 w-5 text-brand-50"
                                            aria-hidden="true"
                                          />
                                        </dt>
                                        <dd className="text-sm leading-6 text-brand-50">
                                          <time
                                            dateTime={post.createdAt.toString()}
                                          >
                                            {formatDistanceToNow(
                                              post.createdAt,
                                              {
                                                addSuffix: true,
                                              }
                                            )}
                                          </time>
                                        </dd>
                                      </div>
                                    </dl>
                                    <div className="px-6 py-6">
                                      <Link
                                        href={"/post/" + post.id}
                                        className="text-sm font-semibold leading-6 text-brand-50"
                                      >
                                        View post{" "}
                                        <span aria-hidden="true">&rarr;</span>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-12 flex px-4 sm:hidden">
                        <Link
                          href={"/profile/" + profile.id}
                          className="text-sm font-semibold text-brand-50"
                        >
                          View profile
                          <span aria-hidden="true"> &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </SignedIn>
      </div>
    </>
  );
}
