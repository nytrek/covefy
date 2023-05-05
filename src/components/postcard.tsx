import { useUser } from "@clerk/nextjs";
import { CheckBadgeIcon, PaperClipIcon } from "@heroicons/react/20/solid";
import { Square2StackIcon } from "@heroicons/react/24/outline";
import { Prisma } from "@prisma/client";
import PostDropdown from "@src/components/postdropdown";
import PostStats from "@src/components/poststats";
import ProfileDropdown from "@src/components/profiledropdown";
import { useRouter } from "next/router";
import { ReactNode } from "react";

type Post = Prisma.PostGetPayload<{
  include: {
    _count: true;
    author: true;
    friend: true;
    likes: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
          };
        };
      };
    };
    bookmarks: {
      include: {
        profile: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

interface Props {
  post: Post;
  children?: ReactNode;
  handleOnEditPost: (post: Post) => void;
  handleOnDeletePost: (post: Post) => void;
  handleOnUpdatePost: (post: Post, pinned: boolean) => void;
  handleOnCreateLike: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
  handleOnDeleteLike: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
  handleOnCreateBookmark: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
  handleOnDeleteBookmark: (
    postId: number,
    profileId: string,
    popularity: number
  ) => void;
}

export default function PostCard({
  post,
  children,
  handleOnEditPost,
  handleOnDeletePost,
  handleOnUpdatePost,
  handleOnCreateLike,
  handleOnDeleteLike,
  handleOnCreateBookmark,
  handleOnDeleteBookmark,
}: Props) {
  const { user } = useUser();
  const { query } = useRouter();
  return (
    <div className="space-y-6 text-brand-50">
      {!!post.attachment && (
        <>
          {post.attachment.includes(".mp4") ? (
            <video className="w-full rounded-t-2xl" autoPlay muted loop>
              <source src={post.attachment} type="video/mp4" />
            </video>
          ) : post.attachment.includes(".png") ||
            post.attachment.includes(".jpg") ||
            post.attachment.includes(".jpeg") ? (
            <img
              className="h-full w-full rounded-t-2xl"
              src={post.attachment}
              alt="attachment"
            />
          ) : null}
        </>
      )}

      <div className="px-5">
        {!!post.attachment && post.attachment.includes(".mp3") && (
          <>
            {query.id ? (
              <audio className="my-6 w-full rounded-lg" controls>
                <source src={post.attachment} type="audio/mp3" />
              </audio>
            ) : (
              <>
                {
                  <div className="relative -ml-2 mt-3 inline-flex w-full items-center rounded-full px-3 py-2 text-left text-brand-400">
                    <PaperClipIcon
                      className="-ml-1 mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    <span className="w-full truncate text-sm italic text-brand-500">
                      {post.attachmentPath}
                    </span>
                  </div>
                }
              </>
            )}
          </>
        )}
        <div className="mt-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Square2StackIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Default</span>
            </div>
            <div className="flex items-center justify-between">
              <h4 className="text-lg">{post.title}</h4>
              {post.authorId === user?.id && (
                <PostDropdown
                  post={post}
                  handleOnEditPost={handleOnEditPost}
                  handleOnDeletePost={handleOnDeletePost}
                  handleOnUpdatePost={handleOnUpdatePost}
                />
              )}
            </div>
            <p>{post.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <ProfileDropdown post={post} />
            <div className="flex flex-col">
              <div className="flex items-center space-x-1 font-semibold">
                <span>{post.author?.name}</span>
                {post.author?.premium && (
                  <CheckBadgeIcon className="h-5 w-5 text-brand-50" />
                )}
              </div>
              <div>{`@${post.author?.username}`}</div>
            </div>
          </div>
          <div className="relative flex flex-col space-y-6">
            <PostStats
              post={post}
              handleOnCreateLike={handleOnCreateLike}
              handleOnDeleteLike={handleOnDeleteLike}
              handleOnCreateBookmark={handleOnCreateBookmark}
              handleOnDeleteBookmark={handleOnDeleteBookmark}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
