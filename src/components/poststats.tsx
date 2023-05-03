import { useUser } from "@clerk/nextjs";
import { Prisma } from "@prisma/client";
import BookmarkCheck from "@src/components/bookmarkcheck";
import PostBookmark from "@src/components/postbookmark";
import PostComment from "@src/components/postcomment";
import PostLike from "@src/components/postlike";
import clsx from "clsx";

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

export default function PostStats({
  post,
  handleOnCreateLike,
  handleOnDeleteLike,
  handleOnCreateBookmark,
  handleOnDeleteBookmark,
}: Props) {
  const { user } = useUser();
  return (
    <div className="relative flex-col space-y-6">
      <div className="flex items-center justify-between space-x-6">
        <div className="flex items-center space-x-6">
          <PostLike
            post={post}
            handleOnCreateLike={handleOnCreateLike}
            handleOnDeleteLike={handleOnDeleteLike}
          />
          <PostComment post={post} />
          <PostBookmark
            post={post}
            handleOnCreateBookmark={handleOnCreateBookmark}
            handleOnDeleteBookmark={handleOnDeleteBookmark}
          />
        </div>
        {!!post.friend && (
          <img
            src={post.friend.imageUrl}
            alt="avatar"
            className="h-5 w-5 flex-shrink-0 rounded-full"
          />
        )}
      </div>
      <div
        className={clsx(
          !!post.bookmarks.find(
            (bookmark) => bookmark.profileId === user?.id
          ) && "pb-6"
        )}
      >
        <BookmarkCheck post={post} />
      </div>
    </div>
  );
}
