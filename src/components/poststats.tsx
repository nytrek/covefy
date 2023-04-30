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
    <div className="relative flex flex-col space-y-6">
      <div className="flex space-x-6">
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
      <BookmarkCheck post={post} />
    </div>
  );
}
