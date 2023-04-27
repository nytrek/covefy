import { SignedIn, useUser } from "@clerk/nextjs";
import { CalendarDaysIcon, ChartBarIcon } from "@heroicons/react/20/solid";
import { Status } from "@prisma/client";
import Header from "@src/components/header";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "../utils/trpc";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

export default function Friends() {
  /**
   * user hook by clerk
   */
  const { user } = useUser();

  /**
   * trpc context
   */
  const utils = trpc.useContext();

  /**
   * useState that might be replaced with a state management library
   */
  const [search, setSearch] = useState("");

  /**
   * trpc queries
   */
  const friends = trpc.getAllFriends.useQuery();

  /**
   * update friend status mutation that links to corresponding procedure in the backend
   */
  const updateFriendStatus = trpc.updateFriendStatus.useMutation({
    onSuccess: () => {
      toast.dismiss();
      utils.getAllFriends.invalidate();
      toast.success("Friend request updated!");
      utils.getSendingFriendStatus.invalidate();
      utils.getReceivingFriendStatus.invalidate();
    },
    onError: (err: any) => {
      toast.dismiss();
      toast.error(err.message ?? API_ERROR_MESSAGE);
    },
  });

  /**
   * event handler for updating friend status
   */
  const handleOnUpdate = (id: string, status: Status) => {
    if (!user?.id) return; //we have values that depend on the data being not undefined
    toast.loading("Loading...");
    updateFriendStatus.mutate({
      senderId: id,
      receiverId: user.id, // 1.
      status,
    });
  };
  return (
    <>
      <div className="pb-36">
        <Header
          header="Explore notes from friends."
          search={search}
          setSearch={setSearch}
          handleOnClick={() => null}
        />
        <SignedIn>
          <div className="mt-8 px-2 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-8">
              {friends.data
                ?.filter(
                  (friend) =>
                    friend.sender.name
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    friend.receiver.name
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((item, index) => (
                  <div key={index} className="w-full">
                    <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-brand-50">
                            {item.senderId === user?.id
                              ? item.receiver.name
                              : item.sender.name}
                          </h2>
                          <p className="text-brand-500">
                            {item.status === "ACCEPTED"
                              ? "Latest posts"
                              : item.status === "PENDING"
                              ? "Friend request pending"
                              : "Friend request rejected"}
                          </p>
                        </div>
                        <Link
                          href={`/profile/${
                            item.senderId === user?.id
                              ? item.receiverId
                              : item.senderId
                          }`}
                          className="hidden text-sm font-semibold text-brand-50 sm:block"
                        >
                          View profile
                          <span aria-hidden="true"> &rarr;</span>
                        </Link>
                      </div>

                      <div className="relative mt-8">
                        <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                          {item.status === "ACCEPTED" ? (
                            <>
                              {item.senderId === user?.id ? (
                                <>
                                  {item.receiver.posts.length > 0 ? (
                                    <ul
                                      role="list"
                                      className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                                    >
                                      {item.receiver.posts.map((post) => (
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
                                                    <span className="sr-only">
                                                      Stats
                                                    </span>
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
                                                  <span aria-hidden="true">
                                                    &rarr;
                                                  </span>
                                                </Link>
                                              </div>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                      <img
                                        src={item.receiver.imageUrl}
                                        alt="receiver"
                                        className="h-14 w-14 rounded-full"
                                      />
                                      <p className="text-center text-sm font-semibold text-brand-50">
                                        {item.receiver.name} has not created any
                                        posts
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {item.sender.posts.length > 0 ? (
                                    <ul
                                      role="list"
                                      className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                                    >
                                      {item.sender.posts.map((post) => (
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
                                                    <span className="sr-only">
                                                      Stats
                                                    </span>
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
                                                  <span aria-hidden="true">
                                                    &rarr;
                                                  </span>
                                                </Link>
                                              </div>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                      <img
                                        src={item.sender.imageUrl}
                                        alt="sender"
                                        className="h-14 w-14 rounded-full"
                                      />
                                      <p className="text-center text-sm font-semibold text-brand-50">
                                        {item.sender.name} has not created any
                                        posts
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : item.status === "PENDING" ? (
                            <>
                              {item.senderId === user?.id ? (
                                <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                  <img
                                    src={item.receiver.imageUrl}
                                    alt="receiver"
                                    className="h-14 w-14 rounded-full"
                                  />
                                  <p className="text-center text-sm font-semibold text-brand-50">
                                    You sent a friend request to{" "}
                                    {item.receiver.name}
                                  </p>
                                </div>
                              ) : (
                                <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                  <img
                                    src={item.sender.imageUrl}
                                    alt="receiver"
                                    className="h-14 w-14 rounded-full"
                                  />
                                  <p className="text-center text-sm font-semibold text-brand-50">
                                    You have received a friend request from{" "}
                                    {item.sender.name}
                                  </p>
                                  <div className="flex w-full flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-center sm:space-x-3 sm:space-y-0 sm:space-x-reverse">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOnUpdate(
                                          item.senderId,
                                          "REJECTED"
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-md bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm ring-1 ring-inset ring-brand-300 hover:bg-brand-50"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOnUpdate(
                                          item.senderId,
                                          "ACCEPTED"
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {item.senderId === user?.id ? (
                                <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                  <img
                                    src={item.receiver.imageUrl}
                                    alt="receiver"
                                    className="h-14 w-14 rounded-full"
                                  />
                                  <p className="text-center text-sm font-semibold text-brand-50">
                                    {item.receiver.name} has rejected your
                                    friend request
                                  </p>
                                </div>
                              ) : (
                                <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                                  <img
                                    src={item.sender.imageUrl}
                                    alt="sender"
                                    className="h-14 w-14 rounded-full"
                                  />
                                  <p className="text-center text-sm font-semibold text-brand-50">
                                    You have rejected {item.sender.name}&apos;s
                                    friend request
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-12 flex px-4 sm:hidden">
                        <Link
                          href={`/profile/${
                            item.senderId === user?.id
                              ? item.receiverId
                              : item.senderId
                          }`}
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
