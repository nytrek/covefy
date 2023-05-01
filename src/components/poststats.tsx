import { Prisma } from "@prisma/client";
import Bookmark from "@src/components/bookmark";
import BookmarkCheck from "@src/components/bookmarkcheck";
import Comment from "@src/components/comment";
import Like from "@src/components/like";

type Post = Prisma.PostGetPayload<{
  include: {
    likes: true;
    bookmarks: true;
    author: true;
    friend: true;
    comments: {
      include: {
        author: true;
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
      <div className="flex items-center justify-between">
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
