import { SignedIn, useUser } from "@clerk/nextjs";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Status } from "@prisma/client";
import PostMessage from "@src/components/postmessage";
import ProfileHeader from "@src/components/profileheader";
import ProfilePosts from "@src/components/profileposts";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "../utils/trpc";

const API_ERROR_MESSAGE =
  "API request failed, please refresh the page and try again.";

export default function Friends() {
  const { user } = useUser();
  const utils = trpc.useContext();
  const [search, setSearch] = useState("");
  const friends = trpc.getAllFriends.useQuery();

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

  const handleOnUpdate = (id: string, status: Status) => {
    if (!user?.id) return;
    toast.loading("Loading...");
    updateFriendStatus.mutate({
      senderId: id,
      receiverId: user.id,
      status,
    });
  };
  return (
    <>
      <div className="pb-36">
        <div className="space-y-12">
          <div className="mx-auto mt-12 max-w-xl space-y-10 px-4 text-center">
            <p className="text-3xl font-semibold text-brand-50"></p>
            <div className="flex flex-1 justify-center">
              <div className="w-full lg:px-6">
                <label htmlFor="search" className="sr-only">
                  Search posts
                </label>
                <div className="relative flex items-center text-brand-50">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-lg border-0 bg-brand-600 bg-opacity-25 py-3 pl-10 text-brand-50 placeholder:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-50"
                    placeholder="Search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <SignedIn>
          <div className="mt-8 px-2 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-8">
              {friends.data ? (
                <>
                  {friends.data
                    .filter(
                      (friend) =>
                        friend.sender.name
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        friend.receiver.name
                          .toLowerCase()
                          .includes(search.toLowerCase())
                    )
                    .map((friend) => (
                      <div
                        key={friend.senderId + " " + friend.receiverId}
                        className="w-full"
                      >
                        <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                          <ProfileHeader
                            url={`/profile/${
                              friend.senderId === user?.id
                                ? friend.receiverId
                                : friend.senderId
                            }`}
                            name={
                              friend.senderId === user?.id
                                ? friend.receiver.name
                                : friend.sender.name
                            }
                            text={
                              friend.status === "ACCEPTED"
                                ? "Latest posts"
                                : friend.status === "PENDING"
                                ? "Friend request pending"
                                : "Friend request rejected"
                            }
                            popularity={
                              friend.senderId === user?.id
                                ? friend.receiver.popularity
                                : friend.sender.popularity
                            }
                          />

                          <div className="relative mt-8">
                            <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                              {friend.status === "ACCEPTED" ? (
                                <>
                                  {friend.senderId === user?.id ? (
                                    <>
                                      {friend.receiver.posts.length > 0 ? (
                                        <ul
                                          role="list"
                                          className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                                        >
                                          {friend.receiver.posts.map((post) => (
                                            <ProfilePosts
                                              key={post.id}
                                              post={post}
                                            />
                                          ))}
                                        </ul>
                                      ) : (
                                        <PostMessage
                                          message={`${friend.receiver.name} has not created any posts`}
                                          imageUrl={friend.receiver.imageUrl}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {friend.sender.posts.length > 0 ? (
                                        <ul
                                          role="list"
                                          className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                                        >
                                          {friend.sender.posts.map((post) => (
                                            <ProfilePosts
                                              key={post.id}
                                              post={post}
                                            />
                                          ))}
                                        </ul>
                                      ) : (
                                        <PostMessage
                                          message={`${friend.sender.name} has not created any posts`}
                                          imageUrl={friend.sender.imageUrl}
                                        />
                                      )}
                                    </>
                                  )}
                                </>
                              ) : friend.status === "PENDING" ? (
                                <>
                                  {friend.senderId === user?.id ? (
                                    <PostMessage
                                      message={`You sent a friend request to ${friend.receiver.name}`}
                                      imageUrl={friend.receiver.imageUrl}
                                    />
                                  ) : (
                                    <PostMessage
                                      message={`You have received a friend request from ${friend.sender.name}`}
                                      imageUrl={friend.sender.imageUrl}
                                    >
                                      <div className="flex w-full flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-center sm:space-x-3 sm:space-y-0 sm:space-x-reverse">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOnUpdate(
                                              friend.senderId,
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
                                              friend.senderId,
                                              "ACCEPTED"
                                            )
                                          }
                                          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-brand-50 shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                        >
                                          Accept
                                        </button>
                                      </div>
                                    </PostMessage>
                                  )}
                                </>
                              ) : (
                                <>
                                  {friend.senderId === user?.id ? (
                                    <PostMessage
                                      message={`${friend.receiver.imageUrl} has rejected your friend request`}
                                      imageUrl={friend.receiver.name}
                                    />
                                  ) : (
                                    <PostMessage
                                      message={`You have rejected ${friend.sender.name}'s friend request`}
                                      imageUrl={friend.sender.imageUrl}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-12 flex px-4 sm:hidden">
                            <Link
                              href={`/profile/${
                                friend.senderId === user?.id
                                  ? friend.receiverId
                                  : friend.senderId
                              }`}
                              className="text-sm font-semibold text-brand-50"
                            >
                              View profile
                              <span aria-hidden="true">
                                {" "}
                                <ArrowRightIcon className="inline h-4 w-4" />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="w-full space-y-8">
                  <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                    <div className="flex items-center justify-between px-4 motion-safe:animate-pulse sm:px-6 lg:px-0">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/6"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/12"></div>
                      </div>
                      <div className="hidden h-2.5 w-1/12 items-center space-x-4 rounded-full bg-brand-700 sm:flex"></div>
                    </div>

                    <div className="relative mt-8">
                      <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                        <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                          <span className="h-14 w-14 rounded-full bg-brand-600 motion-safe:animate-pulse" />
                          <div className="flex h-2.5 w-5/12 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex px-4 sm:hidden">
                      <div className="flex h-2.5 w-2/6 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                  <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                    <div className="flex items-center justify-between px-4 motion-safe:animate-pulse sm:px-6 lg:px-0">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/6"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/12"></div>
                      </div>
                      <div className="hidden h-2.5 w-1/12 items-center space-x-4 rounded-full bg-brand-700 sm:flex"></div>
                    </div>

                    <div className="relative mt-8">
                      <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                        <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                          <span className="h-14 w-14 rounded-full bg-brand-600 motion-safe:animate-pulse" />
                          <div className="flex h-2.5 w-5/12 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex px-4 sm:hidden">
                      <div className="flex h-2.5 w-2/6 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                  <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                    <div className="flex items-center justify-between px-4 motion-safe:animate-pulse sm:px-6 lg:px-0">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/6"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/12"></div>
                      </div>
                      <div className="hidden h-2.5 w-1/12 items-center space-x-4 rounded-full bg-brand-700 sm:flex"></div>
                    </div>

                    <div className="relative mt-8">
                      <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                        <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                          <span className="h-14 w-14 rounded-full bg-brand-600 motion-safe:animate-pulse" />
                          <div className="flex h-2.5 w-5/12 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex px-4 sm:hidden">
                      <div className="flex h-2.5 w-2/6 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                  <div className="lg:mx-auto lg:max-w-7xl lg:px-8">
                    <div className="flex items-center justify-between px-4 motion-safe:animate-pulse sm:px-6 lg:px-0">
                      <div className="flex w-full flex-col space-y-3">
                        <div className="flex h-2.5 w-3/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/6"></div>
                        <div className="flex h-2.5 w-1/4 items-center space-x-4 rounded-full bg-brand-700 sm:w-1/12"></div>
                      </div>
                      <div className="hidden h-2.5 w-1/12 items-center space-x-4 rounded-full bg-brand-700 sm:flex"></div>
                    </div>

                    <div className="relative mt-8">
                      <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                        <div className="mx-4 flex flex-col items-center justify-center space-y-6 rounded-lg border border-brand-600 bg-brand-800 px-4 py-8 sm:mx-6 lg:mx-0">
                          <span className="h-14 w-14 rounded-full bg-brand-600 motion-safe:animate-pulse" />
                          <div className="flex h-2.5 w-5/12 items-center space-x-4 rounded-full bg-brand-700 motion-safe:animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex px-4 sm:hidden">
                      <div className="flex h-2.5 w-2/6 items-center space-x-4 rounded-full bg-brand-700"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SignedIn>
      </div>
    </>
  );
}
