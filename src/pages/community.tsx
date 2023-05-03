import { SignedIn } from "@clerk/nextjs";
import Header from "@src/components/header";
import PostMessage from "@src/components/postmessage";
import ProfileHeader from "@src/components/profileheader";
import ProfilePosts from "@src/components/profileposts";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "../utils/trpc";

export default function Community() {
  const [search, setSearch] = useState("");

  const profiles = trpc.getCommunityPosts.useQuery();
  return (
    <>
      <div className="pb-36">
        <Header
          header=""
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
                      <ProfileHeader
                        url={"/profile/" + profile.id}
                        name={profile.name}
                        text="Latest posts"
                      />

                      <div className="relative mt-8">
                        <div className="relative -mb-6 w-full overflow-x-auto pb-6">
                          {profile.posts.length > 0 ? (
                            <ul
                              role="list"
                              className="mx-4 inline-flex space-x-8 sm:mx-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-8 lg:space-x-0"
                            >
                              {profile.posts.map((post) => (
                                <ProfilePosts key={post.id} post={post} />
                              ))}
                            </ul>
                          ) : (
                            <PostMessage
                              message={`${profile.name} has not created any posts`}
                              imageUrl={profile.imageUrl}
                            />
                          )}
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
