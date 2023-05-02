import { useUser } from "@clerk/nextjs";
import { Prisma } from "@prisma/client";
import Bookmark from "@src/components/bookmark";
import BookmarkCheck from "@src/components/bookmarkcheck";
import Comment from "@src/components/comment";
import Like from "@src/components/like";
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
  handleOnCreateLike: (id: number) => void;
  handleOnDeleteLike: (id: number) => void;
  handleOnCreateBookmark: (id: number) => void;
  handleOnDeleteBookmark: (id: number) => void;
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
    <div className="relative flex-col sm:space-y-6">
      <div className="flex items-center justify-end space-x-6 sm:justify-between">
        <div className="hidden items-center space-x-6 sm:flex">
          <Like
            post={post}
            handleOnCreateLike={handleOnCreateLike}
            handleOnDeleteLike={handleOnDeleteLike}
          />
          <Comment post={post} />
          <Bookmark
            post={post}
            handleOnCreateBookmark={handleOnCreateBookmark}
            handleOnDeleteBookmark={handleOnDeleteBookmark}
          />
        </div>
        {!!post.friend && (
          <img
            src={post.friend.imageUrl}
            alt=""
            className="hidden h-5 w-5 flex-shrink-0 rounded-full sm:flex"
          />
        )}
      </div>
      <div
        className={clsx(
          (!!post.friend ||
            !!post.bookmarks.find(
              (bookmark) => bookmark.profileId === user?.id
            )) &&
            "pb-6",
          "flex items-center justify-between"
        )}
      >
        <BookmarkCheck post={post} />
        {!!post.friend && (
          <img
            src={post.friend.imageUrl}
            alt=""
            className="h-5 w-5 flex-shrink-0 rounded-full sm:hidden"
          />
        )}
      </div>
    </div>
  );
}
